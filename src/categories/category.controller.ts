import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { QuerySubCategoryDto } from './dto/query-sub-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ==================== CATEGORY ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new category' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const result = await this.categoryService.create(createCategoryDto);
      return {
        msg: 'Category created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (with pagination and search)' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryCategoryDto) {
    try {
      const result = await this.categoryService.findAll(queryDto);

      // Check if result has pagination (object with data and pagination keys)
      if (result && typeof result === 'object' && 'data' in result && 'pagination' in result) {
        return {
          msg: 'Categories retrieved successfully',
          data: result,
        };
      }

      // Return all data without pagination
      return {
        msg: 'Categories retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  // ==================== SUB-CATEGORY ENDPOINTS (must come before :id routes) ====================

  @Post('sub-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new sub-category' })
  @HttpCode(HttpStatus.CREATED)
  async createSubCategory(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    try {
      const result = await this.categoryService.createSubCategory(createSubCategoryDto);
      return {
        msg: 'Sub-category created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get('sub-categories')
  @ApiOperation({ summary: 'Get all sub-categories (with search and optional categoryId filter)' })
  @HttpCode(HttpStatus.OK)
  async findAllSubCategories(@Query() queryDto: QuerySubCategoryDto) {
    try {
      const result = await this.categoryService.findAllSubCategories(queryDto);
      return {
        msg: 'Sub-categories retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get(':id/sub')
  @ApiOperation({ summary: 'Get sub-categories by category ID (with search)' })
  @ApiParam({
    name: 'id',
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async findSubCategoriesByCategory(
    @Param('id') categoryId: string,
    @Query() queryDto: QuerySubCategoryDto,
  ) {
    try {
      const result = await this.categoryService.findSubCategoriesByCategory(
        categoryId,
        queryDto,
      );
      return {
        msg: 'Sub-categories retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  // ==================== CATEGORY BY ID ENDPOINTS ====================

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.categoryService.findOne(id);
      return {
        msg: 'Category retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const result = await this.categoryService.update(id, updateCategoryDto);
      return {
        msg: 'Category updated successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.categoryService.remove(id);
      return {
        msg: 'Category deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}

@ApiTags('Sub-Categories')
@Controller('sub-categories')
export class SubCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get sub-category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Sub-category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.categoryService.findOneSubCategory(id);
      return {
        msg: 'Sub-category retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update sub-category' })
  @ApiParam({
    name: 'id',
    description: 'Sub-category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    try {
      const result = await this.categoryService.updateSubCategory(id, updateSubCategoryDto);
      return {
        msg: 'Sub-category updated successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete sub-category' })
  @ApiParam({
    name: 'id',
    description: 'Sub-category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.categoryService.removeSubCategory(id);
      return {
        msg: 'Sub-category deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}
