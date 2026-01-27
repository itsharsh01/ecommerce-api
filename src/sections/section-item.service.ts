import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Section } from '../entities/section.entity';
import { SectionItem } from '../entities/section-item.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateSectionItemDto } from './dto/create-section-item.dto';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';

@Injectable()
export class SectionItemService {
  constructor(
    @InjectRepository(SectionItem)
    private sectionItemRepository: Repository<SectionItem>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async create(sectionId: string, createItemDto: CreateSectionItemDto) {
    try {
      // Validate: Either productId OR variantId must be present
      if (!createItemDto.productId && !createItemDto.variantId) {
        throw new BadRequestException(
          'Either productId or variantId must be provided',
        );
      }

      if (createItemDto.productId && createItemDto.variantId) {
        throw new BadRequestException(
          'Cannot provide both productId and variantId',
        );
      }

      // Check if section exists
      const section = await this.sectionRepository.findOne({
        where: { id: sectionId },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      // If productId is provided, validate product exists and is active
      if (createItemDto.productId) {
        const product = await this.productRepository.findOne({
          where: {
            id: createItemDto.productId,
            deletedAt: IsNull(),
            status: ProductStatus.ACTIVE,
          },
        });

        if (!product) {
          throw new NotFoundException(
            'Product not found or not active',
          );
        }
      }

      // If variantId is provided, validate variant exists and product is active
      if (createItemDto.variantId) {
        const variant = await this.variantRepository.findOne({
          where: { id: createItemDto.variantId, deletedAt: IsNull() },
          relations: ['product'],
        });

        if (!variant) {
          throw new NotFoundException('Variant not found');
        }

        // Check if product is active
        if (
          !variant.product ||
          variant.product.deletedAt ||
          variant.product.status !== ProductStatus.ACTIVE
        ) {
          throw new BadRequestException(
            'Variant belongs to an inactive or deleted product',
          );
        }
      }

      const item = this.sectionItemRepository.create({
        section_id: sectionId,
        product_id: createItemDto.productId || null,
        variant_id: createItemDto.variantId || null,
        sortOrder: createItemDto.sortOrder ?? 0,
        isActive: createItemDto.isActive ?? true,
      });

      const savedItem = await this.sectionItemRepository.save(item);

      if (!savedItem) {
        throw new InternalServerErrorException('Failed to create section item');
      }

      return savedItem;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create section item',
      );
    }
  }

  async findBySection(sectionId: string, includeInactive: boolean = false) {
    try {
      const activeStatus = ProductStatus.ACTIVE;

      const queryBuilder = this.sectionItemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.product', 'product', 'product.deletedAt IS NULL AND product.status = :activeStatus')
        .leftJoinAndSelect('item.variant', 'variant', 'variant.deletedAt IS NULL')
        .leftJoinAndSelect('variant.product', 'variantProduct', 'variantProduct.deletedAt IS NULL AND variantProduct.status = :activeStatus')
        .where('item.section_id = :sectionId', { sectionId })
        .setParameter('activeStatus', activeStatus);

      if (!includeInactive) {
        queryBuilder.andWhere('item.isActive = :isActive', { isActive: true });
      }

      const items = await queryBuilder
        .orderBy('item.sortOrder', 'ASC')
        .addOrderBy('item.createdAt', 'ASC')
        .getMany();

      // Filter out items where product/variant is not active (for public API)
      if (!includeInactive) {
        return items.filter(item => {
          // If item has product, ensure product exists and is active
          if (item.product_id && !item.product) {
            return false;
          }
          // If item has variant, ensure variant exists and its product is active
          if (item.variant_id && (!item.variant || !item.variant.product)) {
            return false;
          }
          return true;
        });
      }

      return items;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch section items',
      );
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.sectionItemRepository.findOne({
        where: { id },
        relations: ['section', 'product', 'variant'],
      });

      if (!item) {
        throw new NotFoundException('Section item not found');
      }

      return item;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch section item',
      );
    }
  }

  async update(id: string, updateItemDto: UpdateSectionItemDto) {
    try {
      const item = await this.sectionItemRepository.findOne({
        where: { id },
      });

      if (!item) {
        throw new NotFoundException('Section item not found');
      }

      // Update fields
      if (updateItemDto.sortOrder !== undefined) {
        item.sortOrder = updateItemDto.sortOrder;
      }
      if (updateItemDto.isActive !== undefined) {
        item.isActive = updateItemDto.isActive;
      }

      const updatedItem = await this.sectionItemRepository.save(item);

      if (!updatedItem) {
        throw new InternalServerErrorException('Failed to update section item');
      }

      return updatedItem;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update section item',
      );
    }
  }

  async remove(id: string) {
    try {
      const item = await this.sectionItemRepository.findOne({
        where: { id },
      });

      if (!item) {
        throw new NotFoundException('Section item not found');
      }

      await this.sectionItemRepository.remove(item);

      return { message: 'Section item deleted successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to delete section item',
      );
    }
  }
}
