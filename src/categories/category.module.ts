import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryService } from './category.service';
import { CategoryController, SubCategoryController } from './category.controller';
import { Category } from '../entities/category.entity';
import { SubCategory } from '../entities/sub-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, SubCategory]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<number | undefined>('JWT_EXPIRATION') ?? '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CategoryController, SubCategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
