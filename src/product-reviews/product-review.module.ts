import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductReviewService } from './product-review.service';
import { ProductReviewController } from './product-review.controller';
import { ProductReview } from '../entities/product-review.entity';
import { Product } from '../entities/product.entity';
import { ImageModule } from '../images/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductReview, Product]),
    ImageModule, // Import ImageModule to use ImageService
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
    ConfigModule,
  ],
  controllers: [ProductReviewController],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
