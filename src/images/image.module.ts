import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { Image } from '../entities/image.entity';
import { S3Service } from './s3/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
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
  controllers: [ImageController],
  providers: [ImageService, S3Service],
  exports: [ImageService],
})
export class ImageModule {}
