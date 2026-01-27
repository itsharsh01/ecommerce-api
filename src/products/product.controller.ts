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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly variantService: VariantService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new product (status: draft)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new InternalServerErrorException('User ID not found in token');
      }

      const result = await this.productService.create(createProductDto, userId);
      return {
        msg: 'Product created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get products with filters (public: only active)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'subCategoryId', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryProductDto, @Request() req: any) {
    try {
      // Check if user is authenticated (admin can see all statuses)
      const isAdmin = req.user !== undefined;
      const result = await this.productService.findAll(queryDto, isAdmin);
      return {
        msg: 'Products retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.productService.findOne(id);
      return {
        msg: 'Product retrieved successfully',
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
  @ApiOperation({ summary: 'Update product details' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      const result = await this.productService.update(id, updateProductDto);
      return {
        msg: 'Product updated successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product status (draft/active/inactive)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    try {
      const result = await this.productService.updateStatus(id, updateStatusDto);
      return {
        msg: 'Product status updated successfully',
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
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.productService.remove(id);
      return {
        msg: 'Product deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add variant to product' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.CREATED)
  async createVariant(
    @Param('id') productId: string,
    @Body() createVariantDto: CreateVariantDto,
  ) {
    try {
      const result = await this.variantService.create(productId, createVariantDto);
      return {
        msg: 'Variant created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}
