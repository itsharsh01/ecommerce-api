import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, DataSource } from 'typeorm';
import { ProductReview } from '../entities/product-review.entity';
import { Product } from '../entities/product.entity';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { ImageService } from '../images/image.service';
import { ModuleType, ImageType } from '../entities/image.entity';
import { Image } from '../entities/image.entity';
import type { File } from 'multer';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private imageService: ImageService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new review for a product with optional file uploads
   * Ensures one review per user per product
   */
  async createReview(
    productId: string,
    userId: string,
    createDto: CreateProductReviewDto,
    files: File[] = [],
  ) {
    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product_id: productId,
        user_id: userId,
        deletedAt: IsNull(),
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Create review
    const review = this.reviewRepository.create({
      product_id: productId,
      user_id: userId,
      rating: createDto.rating,
      title: createDto.title,
      comment: createDto.comment,
      isVerifiedPurchase: false,
      isActive: true,
    } as Partial<ProductReview>);

    const savedReview = await this.reviewRepository.save(review);

    // Upload files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadDto = {
            moduleType: ModuleType.PRODUCT_REVIEW,
            moduleId: savedReview.id,
            type: ImageType.GALLERY,
          };
          await this.imageService.uploadImage(file, uploadDto);
        } catch (fileErr) {
          // Log error but don't fail the review creation
          console.error(`Failed to upload file ${file.originalname}:`, fileErr);
        }
      }
    }

    // Fetch with relations
    const reviewWithRelations = await this.reviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['product', 'user'],
    });

    // Fetch uploaded images
    const images = await this.imageService.findByModule(
      ModuleType.PRODUCT_REVIEW,
      savedReview.id,
    );

    return {
      ...reviewWithRelations,
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        type: img.type,
      })),
    };
  }

  /**
   * Get all active reviews for a product with images
   */
  async getReviewsByProduct(productId: string) {
    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Fetch active reviews
    const reviews = await this.reviewRepository.find({
      where: {
        product_id: productId,
        isActive: true,
        deletedAt: IsNull(),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    if (!reviews.length) {
      return [];
    }

    // Batch fetch review images
    const reviewIds = reviews.map((r) => r.id);
    const images = await this.dataSource.query(
      `
      SELECT id, url, "moduleType", "module_id", type
      FROM images
      WHERE
        "moduleType" = $1
        AND "module_id" = ANY($2::uuid[])
        AND type = $3
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" ASC
    `,
      [ModuleType.PRODUCT_REVIEW, reviewIds, ImageType.GALLERY],
    );

    // Organize images by review_id
    const reviewImagesMap = new Map<string, any[]>();
    images.forEach((img: any) => {
      if (!reviewImagesMap.has(img.module_id)) {
        reviewImagesMap.set(img.module_id, []);
      }
      reviewImagesMap.get(img.module_id)!.push({
        id: img.id,
        url: img.url,
        type: img.type,
      });
    });

    // Map reviews with images
    const reviewsWithImages = reviews.map((review) => ({
      id: review.id,
      product_id: review.product_id,
      user_id: review.user_id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isActive: review.isActive,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user
        ? {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            email: review.user.email,
          }
        : null,
      images: reviewImagesMap.get(review.id) || [],
    }));

    return reviewsWithImages;
  }

  /**
   * Update a review
   * Only owner or admin can update
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updateDto: UpdateProductReviewDto,
    isAdmin: boolean = false,
  ) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, deletedAt: IsNull() },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is owner or admin
    if (review.user_id !== userId && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this review',
      );
    }

    // Update fields
    if (updateDto.rating !== undefined) {
      review.rating = updateDto.rating;
    }
    if (updateDto.title !== undefined) {
      review.title = updateDto.title;
    }
    if (updateDto.comment !== undefined) {
      review.comment = updateDto.comment;
    }
    // Only admin can update isActive
    if (updateDto.isActive !== undefined && isAdmin) {
      review.isActive = updateDto.isActive;
    }

    const updatedReview = await this.reviewRepository.save(review);

    // Fetch with relations
    const reviewWithRelations = await this.reviewRepository.findOne({
      where: { id: updatedReview.id },
      relations: ['product', 'user'],
    });

    return reviewWithRelations;
  }

  /**
   * Soft delete a review and its images
   */
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, deletedAt: IsNull() },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is owner or admin
    if (review.user_id !== userId && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this review',
      );
    }

    // Soft delete review
    await this.reviewRepository.softDelete(reviewId);

    // Soft delete related images
    const images = await this.imageService.findByModule(
      ModuleType.PRODUCT_REVIEW,
      reviewId,
    );

    if (images.length > 0) {
      const imageIds = images.map((img) => img.id);
      await this.dataSource.getRepository(Image).softDelete(imageIds);
    }

    return { message: 'Review deleted successfully' };
  }

  /**
   * Check if review exists and user owns it
   */
  async verifyReviewOwnership(reviewId: string, userId: string): Promise<boolean> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, deletedAt: IsNull() },
    });

    if (!review) {
      return false;
    }

    return review.user_id === userId;
  }
}
