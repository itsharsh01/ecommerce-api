import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, DataSource } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ImageService } from '../images/image.service';
import { ModuleType, ImageType } from '../entities/image.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private imageService: ImageService,
    private dataSource: DataSource,
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
        seller_id: userId, // Set seller_id to the user creating the product
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

  async findAll(queryDto: QueryProductDto, isAdmin = false) {
    const page = Number(queryDto.page) || 1;
    const limit = Number(queryDto.limit) || 10;
    const skip = (page - 1) * limit;

    /* --------------------------------
     * 1️⃣ Base Product Query (LIGHT)
     * -------------------------------- */
    const baseQB = this.productRepository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL');
    console.log('====isAdmin=====', isAdmin);

    if (!isAdmin) {
      baseQB.andWhere('product.status = :status', {
        // status: ProductStatus.ACTIVE,
        status: ProductStatus.DRAFT,
      });
    }

    if (queryDto.search) {
      baseQB.andWhere('product.name ILIKE :search', {
        search: `%${queryDto.search}%`,
      });
    }

    if (queryDto.brandId) {
      baseQB.andWhere('product.brand_id = :brandId', {
        brandId: queryDto.brandId,
      });
    }

    if (queryDto.subCategoryId) {
      baseQB.andWhere('product.sub_category_id = :subCategoryId', {
        subCategoryId: queryDto.subCategoryId,
      });
    }

    /* --------------------------------
     * 2️⃣ Price Filter (EXISTS — FAST)
     * -------------------------------- */
    if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
      const priceSubQuery = this.productRepository
        .createQueryBuilder('p2')
        .select('1')
        .innerJoin('p2.variants', 'v2', 'v2.deletedAt IS NULL')
        .where('p2.id = product.id');

      if (queryDto.minPrice !== undefined) {
        priceSubQuery.andWhere('v2.price >= :minPrice');
        baseQB.setParameter('minPrice', queryDto.minPrice);
      }

      if (queryDto.maxPrice !== undefined) {
        priceSubQuery.andWhere('v2.price <= :maxPrice');
        baseQB.setParameter('maxPrice', queryDto.maxPrice);
      }

      baseQB.andWhere(`EXISTS (${priceSubQuery.getQuery()})`);
    }

    /* --------------------------------
     * 3️⃣ Total Count (NO JOINS)
     * -------------------------------- */
    const total = await baseQB.getCount();

    /* --------------------------------
     * 4️⃣ Paginated Products
     * -------------------------------- */
    const products = await baseQB
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    if (!products.length) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const productIds = products.map((p) => p.id);

    /* --------------------------------
     * 5️⃣ Fetch ACTIVE Variants (Default First)
     * -------------------------------- */
    const variants = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('variant.deletedAt IS NULL')
      .andWhere('variant.isActive = true')
      .orderBy('variant.isDefault', 'DESC')
      .getMany();

    const variantMap = new Map<string, any>();
    for (const v of variants) {
      if (!variantMap.has(v.product_id)) {
        variantMap.set(v.product_id, v);
      }
    }

    const variantIds = [...variantMap.values()].map((v) => v.id);

    /* --------------------------------
     * 6️⃣ Fetch Primary Images (ONE QUERY)
     * -------------------------------- */
    const images = await this.dataSource.query(
      `
      SELECT id, url, "moduleType", "module_id"
      FROM images
      WHERE
        (
          ("moduleType" = 'product' AND "module_id" = ANY($1::uuid[]))
          OR
          ("moduleType" = 'variant' AND "module_id" = ANY($2::uuid[]))
        )
        AND type = 'primary'
        AND "deletedAt" IS NULL
      `,
      [productIds, variantIds],
    );

    const productImageMap = new Map<string, string>();
    const variantImageMap = new Map<string, string>();

    images.forEach((img: any) => {
      if (img.moduleType === 'product') {
        productImageMap.set(img.module_id, img.url);
      } else {
        variantImageMap.set(img.module_id, img.url);
      }
    });

    /* --------------------------------
     * 7️⃣ Final Response Mapping
     * -------------------------------- */
    const data = products.map((product) => {
      const variant = variantMap.get(product.id);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        coverImage:
          productImageMap.get(product.id) ||
          (variant ? variantImageMap.get(variant.id) : null),
        price: variant?.price ?? null,
        mrp: variant?.mrp ?? null,
        brand_id: product.brand_id,
        sub_category_id: product.sub_category_id,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    /* --------------------------------
     * 8️⃣ Pagination Response
     * -------------------------------- */
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['variants', 'brand', 'subCategory'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Filter out deleted variants
    const activeVariants = product.variants?.filter((v) => !v.deletedAt) || [];

    // Get default variant (variant with isDefault=true, or first active variant)
    const defaultVariant =
      activeVariants.find((v) => v.isDefault && v.isActive) ||
      activeVariants.find((v) => v.isActive) ||
      activeVariants[0];

    // Fetch all images in one query
    const variantIds = activeVariants.map((v) => v.id);
    const imagesQuery = `
        SELECT
          id, url, "moduleType", "module_id", type
        FROM images
        WHERE
          (
            ("moduleType" = 'product' AND "module_id" = $1::uuid)
            OR
            ("moduleType" = 'variant' AND "module_id" = ANY($2::uuid[]))
          )
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" ASC
      `;
    const images = await this.dataSource.query(imagesQuery, [id, variantIds]);

    // Organize images by module_id and type
    const productImages: any[] = [];
    const variantImagesMap = new Map<string, any[]>();

    images.forEach((img: any) => {
      if (img.moduleType === 'product') {
        productImages.push({
          id: img.id,
          url: img.url,
          type: img.type,
        });
      } else if (img.moduleType === 'variant') {
        if (!variantImagesMap.has(img.module_id)) {
          variantImagesMap.set(img.module_id, []);
        }
        variantImagesMap.get(img.module_id)!.push({
          id: img.id,
          url: img.url,
          type: img.type,
        });
      }
    });

    // Map variants with images
    const variantsWithImages = activeVariants.map((variant) => ({
      ...variant,
      images: variantImagesMap.get(variant.id) || [],
    }));

    // Get default variant with images
    const defaultVariantWithImages = defaultVariant
      ? {
          ...defaultVariant,
          images: variantImagesMap.get(defaultVariant.id) || [],
        }
      : null;

    return {
      ...product,
      images: productImages,
      defaultVariant: defaultVariantWithImages,
      variants: variantsWithImages,
    };
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
        throw new InternalServerErrorException(
          'Failed to update product status',
        );
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
