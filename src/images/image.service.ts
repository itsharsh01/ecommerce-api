import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Image, ModuleType, ImageType } from '../entities/image.entity';
import { S3Service } from './s3/s3.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { v4 as uuidv4 } from 'uuid';
import type { File } from 'multer';

@Injectable()
export class ImageService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private s3Service: S3Service,
  ) {}

  async uploadImage(
    file: File,
    uploadDto: UploadImageDto,
  ): Promise<{ imageId: string; url: string }> {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
        );
      }

      // Generate unique object key
      const fileExtension = this.getFileExtension(file.originalname);
      const objectKey = `${uuidv4()}-${Date.now()}${fileExtension}`;

      // Upload to S3
      const url = await this.s3Service.uploadFile(
        objectKey,
        file.buffer,
        file.mimetype,
      );

      // Save image metadata to database
      const image = this.imageRepository.create({
        url: url,
        bucket: this.s3Service.getBucketName(),
        objectKey: objectKey,
        moduleType: uploadDto.moduleType,
        module_id: uploadDto.moduleId,
        type: uploadDto.type,
      });

      const savedImage = await this.imageRepository.save(image);

      return {
        imageId: savedImage.id,
        url: savedImage.url,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to upload image',
      );
    }
  }

  async findByModule(
    moduleType: ModuleType,
    moduleId: string,
  ): Promise<Image[]> {
    try {
      const images = await this.imageRepository.find({
        where: {
          moduleType: moduleType,
          module_id: moduleId,
          deletedAt: IsNull(),
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return images;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch images',
      );
    }
  }

  async findByModuleAndType(
    moduleType: ModuleType,
    moduleId: string,
    type: ImageType,
  ): Promise<Image[]> {
    try {
      const images = await this.imageRepository.find({
        where: {
          moduleType: moduleType,
          module_id: moduleId,
          type: type,
          deletedAt: IsNull(),
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return images;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch images',
      );
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }
}
