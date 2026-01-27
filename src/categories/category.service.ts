import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { SubCategory } from '../entities/sub-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { QuerySubCategoryDto } from './dto/query-sub-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private subCategoryRepository: Repository<SubCategory>,
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
    repository: Repository<Category | SubCategory>,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await repository.findOne({
        where: { slug } as any,
        withDeleted: true, // Check even soft-deleted records
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // ==================== CATEGORY METHODS ====================

  async create(createCategoryDto: CreateCategoryDto) {
    // Generate slug if not provided
    const slug = createCategoryDto.slug
      ? createCategoryDto.slug
      : this.generateSlug(createCategoryDto.name);

    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    // Check if name already exists
    const existingName = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
      withDeleted: true,
    });

    if (existingName) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.categoryRepository.save({
      name: createCategoryDto.name,
      slug,
      isActive: createCategoryDto.isActive ?? true,
    });

    if (!category) {
      throw new InternalServerErrorException('Something went wrong');
    }

    return category;
  }

  async findAll(queryDto: QueryCategoryDto) {
    const { page, limit, search } = queryDto;


    // Build query builder for complex conditions
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL'); // Exclude soft-deleted records



    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.slug ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('category.createdAt', 'DESC');

    // ✅ Pagination ONLY if page & limit are valid numbers
    const pageNum = page ? Number(page) : 0;
    const limitNum = limit ? Number(limit) : 0;
    const isPagination = pageNum > 0 && limitNum > 0;

    if (isPagination) {
      const skip = (pageNum - 1) * limitNum;

      queryBuilder.skip(skip).take(limitNum);

      const [categories, total] = await queryBuilder.getManyAndCount();

      return {
        data: categories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPreviousPage: pageNum > 1,
        },
      };
    }

    // ✅ No pagination → return all
    const categories = await queryBuilder.getMany();

    return categories;
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['subCategories'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
      return  category

  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Handle slug update
    if (updateCategoryDto.slug || updateCategoryDto.name) {
      const newSlug = updateCategoryDto.slug
        ? updateCategoryDto.slug
        : updateCategoryDto.name
          ? this.generateSlug(updateCategoryDto.name)
          : category.slug;

      // Check if new slug conflicts with existing
      if (newSlug !== category.slug) {
        const existing = await this.categoryRepository.findOne({
          where: { slug: newSlug },
          withDeleted: true,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Category with this slug already exists');
        }
      }

      category.slug = newSlug;
    }

    // Update other fields
    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;
    }

    const updatedCategory = await this.categoryRepository.save(category);

    return updatedCategory;
  }

  async remove(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete
    await this.categoryRepository.softRemove(category);

    return { id };
  }

  // ==================== SUB-CATEGORY METHODS ====================

  async createSubCategory(createSubCategoryDto: CreateSubCategoryDto) {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createSubCategoryDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Generate slug if not provided
    const slug = createSubCategoryDto.slug
      ? createSubCategoryDto.slug
      : this.generateSlug(createSubCategoryDto.name);

    // Check if slug already exists for this category
    const existingSubCategory = await this.subCategoryRepository.findOne({
      where: { slug, categoryId: createSubCategoryDto.categoryId } as any,
      withDeleted: true,
    });

    if (existingSubCategory) {
      throw new ConflictException(
        'Sub-category with this slug already exists in this category',
      );
    }

    const subCategory = await this.subCategoryRepository.save({
      name: createSubCategoryDto.name,
      slug,
      categoryId: createSubCategoryDto.categoryId,
      isActive: createSubCategoryDto.isActive ?? true,
    });

    // Load category relation
    subCategory.category = category;

    return subCategory;
  }

async findAllSubCategories(queryDto: QuerySubCategoryDto) {
  const { search, categoryId } = queryDto;

  const baseWhere = {
    deletedAt: IsNull(),
    ...(categoryId && { categoryId })
  };

  // OR search using array
  const where = search
    ? [
        { ...baseWhere, name: ILike(`%${search}%`) },
        { ...baseWhere, slug: ILike(`%${search}%`) },
      ]
    : baseWhere;

  return await this.subCategoryRepository.find({
    where,
    relations: {
      category: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}



  async findSubCategoriesByCategory(
    categoryId: string,
    queryDto: QuerySubCategoryDto,
  ) {
    // Verify category exists and is not soft-deleted
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('category.deletedAt IS NULL')
      .getOne();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const { search } = queryDto;

    // Build query builder
    const queryBuilder = this.subCategoryRepository
      .createQueryBuilder('subCategory')
      .leftJoinAndSelect('subCategory.category', 'category', 'category.deletedAt IS NULL')
      .where('subCategory.categoryId = :categoryId', { categoryId })
      .andWhere('subCategory.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(subCategory.name ILIKE :search OR subCategory.slug ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('subCategory.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOneSubCategory(id: string) {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!subCategory) {
      throw new NotFoundException('Sub-category not found');
    }

    return subCategory;
  }

  async updateSubCategory(id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
    });

    if (!subCategory) {
      throw new NotFoundException('Sub-category not found');
    }

    // Handle categoryId update
    if (updateSubCategoryDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateSubCategoryDto.category_id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      subCategory.category_id = updateSubCategoryDto.category_id;
    }

    // Handle slug update
    if (updateSubCategoryDto.slug || updateSubCategoryDto.name) {
      const newSlug = updateSubCategoryDto.slug
        ? updateSubCategoryDto.slug
        : updateSubCategoryDto.name
          ? this.generateSlug(updateSubCategoryDto.name)
          : subCategory.slug;

      // Check if new slug conflicts with existing in the same category
      if (newSlug !== subCategory.slug) {
        const categoryId = updateSubCategoryDto.category_id || subCategory.category_id;
        const existing = await this.subCategoryRepository.findOne({
          where: { slug: newSlug, category_id: categoryId },
          withDeleted: true,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException(
            'Sub-category with this slug already exists in this category',
          );
        }
      }

      subCategory.slug = newSlug;
    }

    // Update other fields
    if (updateSubCategoryDto.name !== undefined) {
      subCategory.name = updateSubCategoryDto.name;
    }

    if (updateSubCategoryDto.isActive !== undefined) {
      subCategory.isActive = updateSubCategoryDto.isActive;
    }

    const updatedSubCategory = await this.subCategoryRepository.save(subCategory);

    // Load category relation
    const category = await this.categoryRepository.findOne({
      where: { id: updatedSubCategory.category_id },
    });

    if (category) {
      updatedSubCategory.category = category;
    }

    return updatedSubCategory;
  }

  async removeSubCategory(id: string) {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
    });

    if (!subCategory) {
      throw new NotFoundException('Sub-category not found');
    }

    // Soft delete
    await this.subCategoryRepository.softRemove(subCategory);

    return { id };
  }
}
