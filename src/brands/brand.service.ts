import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
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

  async create(createBrandDto: CreateBrandDto) {
    // Generate slug if not provided
    const slug = createBrandDto.slug
      ? createBrandDto.slug
      : this.generateSlug(createBrandDto.name);

    // Check if slug already exists
    const existingBrand = await this.brandRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existingBrand) {
      throw new ConflictException('Brand with this slug already exists');
    }

    // Check if name already exists
    const existingName = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
      withDeleted: true,
    });

    if (existingName) {
      throw new ConflictException('Brand with this name already exists');
    }

    const brand = await this.brandRepository.save({
      name: createBrandDto.name,
      slug,
      isActive: createBrandDto.isActive ?? true,
    });

    if (!brand) {
      throw new InternalServerErrorException('Something went wrong');
    }

    return brand;
  }

  async findAll() {
    const brands = await this.brandRepository.find({
      where: { deletedAt: IsNull(), isActive: true },
      order: { createdAt: 'DESC' },
    });

    return brands;
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandRepository.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Handle slug update
    if (updateBrandDto.slug || updateBrandDto.name) {
      const newSlug = updateBrandDto.slug
        ? updateBrandDto.slug
        : updateBrandDto.name
          ? this.generateSlug(updateBrandDto.name)
          : brand.slug;

      // Check if new slug conflicts with existing
      if (newSlug !== brand.slug) {
        const existing = await this.brandRepository.findOne({
          where: { slug: newSlug },
          withDeleted: true,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Brand with this slug already exists');
        }
      }

      brand.slug = newSlug;
    }

    // Update other fields
    if (updateBrandDto.name !== undefined) {
      brand.name = updateBrandDto.name;
    }

    if (updateBrandDto.isActive !== undefined) {
      brand.isActive = updateBrandDto.isActive;
    }

    const updatedBrand = await this.brandRepository.save(brand);

    return updatedBrand;
  }

  async remove(id: string) {
    const brand = await this.brandRepository.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Soft delete
    await this.brandRepository.softRemove(brand);

    return { id };
  }
}
