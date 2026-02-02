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
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Variants')
@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Get('detail')
  @ApiOperation({
    summary: 'Get variant detail by productId or variantId',
    description:
      'If productId: returns default variant (creates one if doesn\'t exist). If variantId: returns that variant with full product context.',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    description: 'Product ID (UUID) - returns default variant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'variantId',
    required: false,
    type: String,
    description: 'Variant ID (UUID) - returns that variant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async getVariantDetail(
    @Query('productId') productId?: string,
    @Query('variantId') variantId?: string,
  ) {
    try {
      if (!productId && !variantId) {
        throw new HttpException(
          'Either productId or variantId must be provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.variantService.getVariantDetail(
        productId,
        variantId,
      );
      return {
        msg: 'Variant detail retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get variant by ID with full product context (for variant switching)' })
  @ApiParam({
    name: 'id',
    description: 'Variant ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.variantService.findVariantDetailWithProduct(id);
      return {
        msg: 'Variant detail retrieved successfully',
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
  @ApiOperation({ summary: 'Update variant' })
  @ApiParam({
    name: 'id',
    description: 'Variant ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    try {
      const result = await this.variantService.update(id, updateVariantDto);
      return {
        msg: 'Variant updated successfully',
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
  @ApiOperation({ summary: 'Soft delete variant' })
  @ApiParam({
    name: 'id',
    description: 'Variant ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.variantService.remove(id);
      return {
        msg: 'Variant deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Patch(':id/set-default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set variant as default (only one variant per product can be default)' })
  @ApiParam({
    name: 'id',
    description: 'Variant ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async setAsDefault(@Param('id') id: string) {
    try {
      const result = await this.variantService.setAsDefault(id);
      return {
        msg: 'Variant set as default successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}
