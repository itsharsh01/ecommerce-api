import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductService } from './product.service';
import { VariantService } from './variant.service';
import { ProductController } from './product.controller';
import { VariantController } from './variant.controller';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductReview } from '../entities/product-review.entity';
import { ImageModule } from '../images/image.module';
import { ProductReviewModule } from '../product-reviews/product-review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductReview]),
    ImageModule, // Import ImageModule to use ImageService
    ProductReviewModule, // Import ProductReviewModule to use ProductReviewService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          expiresIn:
            configService.get<number | undefined>('JWT_EXPIRATION') ?? '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductController, VariantController],
  providers: [ProductService, VariantService],
  exports: [ProductService, VariantService],
})
export class ProductModule {}
