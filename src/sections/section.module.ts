import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SectionService } from './section.service';
import { SectionItemService } from './section-item.service';
import { SectionController } from './section.controller';
import { SectionItemController } from './section-item.controller';
import { Section } from '../entities/section.entity';
import { SectionItem } from '../entities/section-item.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Section, SectionItem, Product, ProductVariant]),
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
  controllers: [SectionController, SectionItemController],
  providers: [SectionService, SectionItemService],
  exports: [SectionService, SectionItemService],
})
export class SectionModule {}
