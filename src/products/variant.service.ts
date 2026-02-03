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
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ImageService } from '../images/image.service';
import { Image } from '../entities/image.entity';

@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private imageService: ImageService,
    private dataSource: DataSource,
  ) {}

  async create(productId: string, createVariantDto: CreateVariantDto) {
    try {
      // Check if product exists and is not deleted
      const product = await this.productRepository.findOne({
        where: { id: productId, deletedAt: IsNull() },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check if SKU already exists
      const existingSku = await this.variantRepository.findOne({
        where: { sku: createVariantDto.sku },
        withDeleted: true,
      });

      if (existingSku) {
        throw new ConflictException('Variant with this SKU already exists');
      }

      const variant = this.variantRepository.create({
        product_id: productId,
        sku: createVariantDto.sku,
        attributes: createVariantDto.attributes || {},
        price: createVariantDto.price,
        mrp: createVariantDto.mrp,
        stock: createVariantDto.stock ?? 0,
        isActive: createVariantDto.isActive ?? true,
      });

      const savedVariant = await this.variantRepository.save(variant);

      if (!savedVariant) {
        throw new InternalServerErrorException('Failed to create variant');
      }

      return savedVariant;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create variant',
      );
    }
  }

  async findOne(id: string) {
    try {
      const variant = await this.variantRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['product'],
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      return variant;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch variant',
      );
    }
  }

  /**
   * Get variant detail with full product context (for variant switching)
   * Returns product info with selected variant and all available variants
   */

  private mapVariantProductResponse(rows: any[], selectedVariantId: string) {
  const product: {
    id: string;
    name: string;
    images: any[];
    variants: Array<{ id: string; price: number; images: any[] }>;
  } = {
    id: rows[0].product_id,
    name: rows[0].product_name,
    images: [],
    variants: [],
  };

  const productImagesMap = new Map();
  const variantImagesMap = new Map();
  const variantsMap = new Map();

  rows.forEach((r) => {
    // product images
    if (r.productImage_id && !productImagesMap.has(r.productImage_id)) {
      productImagesMap.set(r.productImage_id, {
        id: r.productImage_id,
        url: r.productImage_url,
        type: r.productImage_type,
      });
    }

    // variants
    if (!variantsMap.has(r.variant_id)) {
      variantsMap.set(r.variant_id, {
        id: r.variant_id,
        price: r.variant_price,
        images: [],
      });
    }

    // variant images
    if (r.variantImage_id) {
      const imgs = variantImagesMap.get(r.variant_id) || [];
      imgs.push({
        id: r.variantImage_id,
        url: r.variantImage_url,
        type: r.variantImage_type,
      });
      variantImagesMap.set(r.variant_id, imgs);
    }
  });

  product.images = [...productImagesMap.values()];

  product.variants = [...variantsMap.values()].map((v) => ({
    ...v,
    images: variantImagesMap.get(v.id) || [],
  }));

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId,
  );

  return {
    ...product,
    selectedVariant,
  };
}


async findVariantDetailWithProduct(variantId: string) {
  const rows = await this.variantRepository
    .createQueryBuilder('selectedVariant')
    .innerJoinAndSelect(
      'selectedVariant.product',
      'product',
      'product.deletedAt IS NULL',
    )
    .leftJoinAndSelect(
      'product.variants',
      'variant',
      'variant.deletedAt IS NULL',
    )
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.subCategory', 'subCategory')

    // Product images
    .leftJoin(
      Image,
      'productImage',
      `
      productImage.moduleType = 'product'
      AND productImage.module_id = product.id
      AND productImage.deletedAt IS NULL
      `,
    )

    // Variant images
    .leftJoin(
      Image,
      'variantImage',
      `
      variantImage.moduleType = 'variant'
      AND variantImage.module_id = variant.id
      AND variantImage.deletedAt IS NULL
      `,
    )

    .where('selectedVariant.id = :variantId', { variantId })
    .andWhere('selectedVariant.deletedAt IS NULL')

    .select([
      // product
      'product.id',
      'product.name',
      'product.slug',

      // brand / subcategory
      'brand.id',
      'brand.name',
      'subCategory.id',
      'subCategory.name',

      // variants
      'variant.id',
      'variant.price',
      'variant.sku',

      // selected variant
      'selectedVariant.id',
      'selectedVariant.price',

      // images
      'productImage.id',
      'productImage.url',
      'productImage.type',

      'variantImage.id',
      'variantImage.url',
      'variantImage.type',
    ])
    .getRawMany();

  if (!rows.length) {
    throw new NotFoundException('Variant not found');
  }

  return this.mapVariantProductResponse(rows, variantId);
}


  async update(id: string, updateVariantDto: UpdateVariantDto) {

      const variant = await this.variantRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      // If SKU is being updated, check for conflicts
      if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
        const existingSku = await this.variantRepository.findOne({
          where: { sku: updateVariantDto.sku },
          withDeleted: true,
        });

        if (existingSku && existingSku.id !== id) {
          throw new ConflictException('Variant with this SKU already exists');
        }
      }

      // Update fields
      Object.assign(variant, updateVariantDto);

      const updatedVariant = await this.variantRepository.save(variant);

      if (!updatedVariant) {
        throw new InternalServerErrorException('Failed to update variant');
      }

      return updatedVariant;
  }

  async remove(id: string) {
    try {
      const variant = await this.variantRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      await this.variantRepository.softDelete(id);

      return { message: 'Variant deleted successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to delete variant',
      );
    }
  }

  /**
   * Get variant detail by productId or variantId
   * If productId: returns default variant (creates one if doesn't exist)
   * If variantId: returns that variant
   */
  async getVariantDetail(productId?: string, variantId?: string) {

      let variant: ProductVariant | null = null;

      // If variantId is provided, fetch that variant
      if (variantId) {
        variant = await this.variantRepository.findOne({
          where: { id: variantId, deletedAt: IsNull() },
          relations: ['product'],
        });

        if (!variant) {
          throw new NotFoundException('Variant not found');
        }
      }
      // If productId is provided, fetch default variant
      else if (productId) {
        // Check if product exists
        const product = await this.productRepository.findOne({
          where: { id: productId, deletedAt: IsNull() },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Find default variant
        variant = await this.variantRepository.findOne({
          where: {
            product_id: productId,
            isDefault: true,
            deletedAt: IsNull(),
          },
          relations: ['product'],
        });

        // If no default variant exists, find first active variant and set it as default
        if (!variant) {
          const firstActiveVariant = await this.variantRepository.findOne({
            where: {
              product_id: productId,
              isActive: true,
              deletedAt: IsNull(),
            },
            relations: ['product'],
            order: { createdAt: 'ASC' },
          });

          if (!firstActiveVariant) {
            throw new NotFoundException(
              'No active variants found for this product',
            );
          }

          // Set this variant as default using transaction
          await this.dataSource.transaction(async (manager) => {
            // Set all other variants of this product to isDefault=false
            await manager.update(
              ProductVariant,
              {
                product_id: productId,
                deletedAt: IsNull(),
              },
              { isDefault: false },
            );

            // Set this variant as default
            await manager.update(ProductVariant, firstActiveVariant.id, {
              isDefault: true,
            });
          });

          // Fetch updated variant
          variant = await this.variantRepository.findOne({
            where: { id: firstActiveVariant.id },
            relations: ['product'],
          });
        }
      } else {
        throw new BadRequestException(
          'Either productId or variantId must be provided',
        );
      }

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      // Fetch variant with full product context and images using optimized query
      return await this.findVariantDetailWithProduct(variant.id);
  }

  /**
   * Set a variant as default for its product
   * Ensures only one variant per product has isDefault=true
   */
  async setAsDefault(variantId: string) {
    try {
      const variant = await this.variantRepository.findOne({
        where: { id: variantId, deletedAt: IsNull() },
        relations: ['product'],
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      // Check if product exists
      const product = await this.productRepository.findOne({
        where: { id: variant.product_id, deletedAt: IsNull() },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Use transaction to ensure atomicity
      await this.dataSource.transaction(async (manager) => {
        // Set all other variants of this product to isDefault=false
        await manager.update(
          ProductVariant,
          {
            product_id: variant.product_id,
            deletedAt: IsNull(),
          },
          { isDefault: false },
        );

        // Set this variant as default
        await manager.update(ProductVariant, variantId, { isDefault: true });
      });

      // Fetch updated variant
      const updatedVariant = await this.variantRepository.findOne({
        where: { id: variantId },
      });

      return updatedVariant;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to set variant as default',
      );
    }
  }
}
