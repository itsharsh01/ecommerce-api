import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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

  async update(id: string, updateVariantDto: UpdateVariantDto) {
    try {
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
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update variant',
      );
    }
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
}
