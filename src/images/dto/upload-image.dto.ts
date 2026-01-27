import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ModuleType, ImageType } from '../../entities/image.entity';

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPEG, PNG, GIF, WebP)',
  })
  file: any;

  @ApiProperty({
    description: 'Module type that owns this image',
    enum: ModuleType,
    example: ModuleType.PRODUCT,
  })
  @IsEnum(ModuleType, {
    message: 'moduleType must be one of: product, variant, product_review, section, brand',
  })
  @IsNotEmpty({ message: 'moduleType is required' })
  moduleType: ModuleType;

  @ApiProperty({
    description: 'UUID of the module that owns this image',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'moduleId must be a valid UUID' })
  @IsNotEmpty({ message: 'moduleId is required' })
  moduleId: string;

  @ApiProperty({
    description: 'Type of image',
    enum: ImageType,
    example: ImageType.PRIMARY,
  })
  @IsEnum(ImageType, {
    message: 'type must be one of: primary, gallery, thumbnail, logo, banner',
  })
  @IsNotEmpty({ message: 'type is required' })
  type: ImageType;
}
