import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  HttpException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageService } from '../images/image.service';
import { UploadImageDto } from '../images/dto/upload-image.dto';
import { ModuleType, ImageType } from '../entities/image.entity';

@ApiTags('Product Reviews')
@Controller()
export class ProductReviewController {
  constructor(
    private readonly reviewService: ProductReviewService,
    private readonly imageService: ImageService,
  ) {}

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a review for a product with optional photos/videos',
    description:
      'Upload multiple files (photos/videos) along with review data. Files are optional.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'productId',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Param('productId') productId: string,
    @Body() createDto: CreateProductReviewDto,
    @Request() req: any,
    @UploadedFiles() files?: Multer.File[],
  ) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new InternalServerErrorException('User ID not found in token');
      }

      const result = await this.reviewService.createReview(
        productId,
        userId,
        createDto,
        files || [],
      );
      return {
        msg: 'Review created successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get all active reviews for a product' })
  @ApiParam({
    name: 'productId',
    description: 'Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async getReviewsByProduct(@Param('productId') productId: string) {
    try {
      const result = await this.reviewService.getReviewsByProduct(productId);
      return {
        msg: 'Reviews retrieved successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  @Patch('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a review (owner or admin only)' })
  @ApiParam({
    name: 'reviewId',
    description: 'Review ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() updateDto: UpdateProductReviewDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new InternalServerErrorException('User ID not found in token');
      }

      // TODO: Check if user is admin (implement admin role check)
      const isAdmin = false;

      const result = await this.reviewService.updateReview(
        reviewId,
        userId,
        updateDto,
        isAdmin,
      );
      return {
        msg: 'Review updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a review (owner or admin only)' })
  @ApiParam({
    name: 'reviewId',
    description: 'Review ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('reviewId') reviewId: string, @Request() req: any) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new InternalServerErrorException('User ID not found in token');
      }

      // TODO: Check if user is admin (implement admin role check)
      const isAdmin = false;

      const result = await this.reviewService.deleteReview(
        reviewId,
        userId,
        isAdmin,
      );
      return result;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  @Post('reviews/:reviewId/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload an image for a review' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'reviewId',
    description: 'Review ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadReviewImage(
    @Param('reviewId') reviewId: string,
    @UploadedFile() file: Multer.File,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new InternalServerErrorException('User ID not found in token');
      }

      // Verify review exists and user owns it
      const ownsReview = await this.reviewService.verifyReviewOwnership(
        reviewId,
        userId,
      );

      if (!ownsReview) {
        throw new HttpException(
          'Review not found or you do not have permission to upload images for this review',
          HttpStatus.FORBIDDEN,
        );
      }

      const uploadDto: UploadImageDto = {
        moduleType: ModuleType.PRODUCT_REVIEW,
        moduleId: reviewId,
        type: ImageType.GALLERY,
      };

      const result = await this.imageService.uploadImage(file, uploadDto);
      return {
        msg: 'Review image uploaded successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }
}
