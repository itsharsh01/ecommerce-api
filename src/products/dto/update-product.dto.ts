import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro Max',
    required: false,
    maxLength: 255,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Updated description',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Brand ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  @IsOptional()
  brandId?: string;

  @ApiProperty({
    description: 'SubCategory ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'subCategoryId must be a valid UUID' })
  @IsOptional()
  subCategoryId?: string;
}
