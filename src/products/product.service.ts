import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate unique slug by appending number if needed
   */
  private async generateUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.productRepository.findOne({
        where: { slug },
        withDeleted: true,
      });

      if (!existing || existing.id === excludeId) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    try {
      // Generate slug
      const baseSlug = this.generateSlug(createProductDto.name);
      const slug = await this.generateUniqueSlug(baseSlug);

      // Check if name already exists
      const existingName = await this.productRepository.findOne({
        where: { name: createProductDto.name },
        withDeleted: true,
      });

      if (existingName) {
        throw new ConflictException('Product with this name already exists');
      }

      const product = this.productRepository.create({
        name: createProductDto.name,
        slug,
        description: createProductDto.description,
        brand_id: createProductDto.brandId,
        sub_category_id: createProductDto.subCategoryId,
        status: ProductStatus.DRAFT,
        createdBy: userId,
      });

      const savedProduct = await this.productRepository.save(product);

      if (!savedProduct) {
        throw new InternalServerErrorException('Failed to create product');
      }

      return savedProduct;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create product',
      );
    }
  }

  async findAll(queryDto: QueryProductDto, isAdmin: boolean = false) {
    try {
      const page = queryDto.page ? Number(queryDto.page) : 1;
      const limit = queryDto.limit ? Number(queryDto.limit) : 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variant', 'variant.deletedAt IS NULL')
        .where('product.deletedAt IS NULL');

      // Public listing: only active products
      if (!isAdmin) {
        queryBuilder.andWhere('product.status = :status', {
          status: ProductStatus.ACTIVE,
        });
      }

      // Search by name
      if (queryDto.search) {
        queryBuilder.andWhere('product.name ILIKE :search', {
          search: `%${queryDto.search}%`,
        });
      }

      // Filter by brandId
      if (queryDto.brandId) {
        queryBuilder.andWhere('product.brand_id = :brandId', {
          brandId: queryDto.brandId,
        });
      }

      // Filter by subCategoryId
      if (queryDto.subCategoryId) {
        queryBuilder.andWhere('product.sub_category_id = :subCategoryId', {
          subCategoryId: queryDto.subCategoryId,
        });
      }

      // Price filter (using variants) - filter products that have variants in price range
      if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
        // Use EXISTS subquery to check if product has any variant in price range
        const subQuery = this.productRepository
          .createQueryBuilder('p2')
          .innerJoin('p2.variants', 'v2', 'v2.deletedAt IS NULL')
          .where('p2.id = product.id');

        if (queryDto.minPrice !== undefined) {
          subQuery.andWhere('v2.price >= :minPrice');
          queryBuilder.setParameter('minPrice', queryDto.minPrice);
        }
        if (queryDto.maxPrice !== undefined) {
          subQuery.andWhere('v2.price <= :maxPrice');
          queryBuilder.setParameter('maxPrice', queryDto.maxPrice);
        }

        queryBuilder.andWhere(`EXISTS (${subQuery.getQuery()})`);
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const products = await queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      // If pagination is requested, return paginated response
      if (queryDto.page && queryDto.limit) {
        return {
          data: products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
          },
        };
      }

      // Otherwise return all results
      return products;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch products',
      );
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['variants'],
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch product',
      );
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // If name is being updated, regenerate slug
      if (updateProductDto.name && updateProductDto.name !== product.name) {
        const baseSlug = this.generateSlug(updateProductDto.name);
        product.slug = await this.generateUniqueSlug(baseSlug, id);

        // Check if new name already exists
        const existingName = await this.productRepository.findOne({
          where: { name: updateProductDto.name },
          withDeleted: true,
        });

        if (existingName && existingName.id !== id) {
          throw new ConflictException('Product with this name already exists');
        }
      }

      // Update fields - map camelCase DTO to snake_case entity properties
      if (updateProductDto.name !== undefined) {
        product.name = updateProductDto.name;
      }
      if (updateProductDto.description !== undefined) {
        product.description = updateProductDto.description;
      }
      if (updateProductDto.brandId !== undefined) {
        product.brand_id = updateProductDto.brandId;
      }
      if (updateProductDto.subCategoryId !== undefined) {
        product.sub_category_id = updateProductDto.subCategoryId;
      }

      const updatedProduct = await this.productRepository.save(product);

      if (!updatedProduct) {
        throw new InternalServerErrorException('Failed to update product');
      }

      return updatedProduct;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update product',
      );
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateProductStatusDto) {
    try {
      const product = await this.productRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      product.status = updateStatusDto.status;

      const updatedProduct = await this.productRepository.save(product);

      if (!updatedProduct) {
        throw new InternalServerErrorException('Failed to update product status');
      }

      return updatedProduct;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update product status',
      );
    }
  }

  async remove(id: string) {
    try {
      const product = await this.productRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      await this.productRepository.softDelete(id);

      return { message: 'Product deleted successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to delete product',
      );
    }
  }
}
