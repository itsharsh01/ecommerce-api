import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    maxLength: 255,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced features',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Brand ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  // @IsUUID('4', { message: 'brandId must be a valid UUID' })
  @IsNotEmpty({ message: 'brandId is required' })
  brandId: string;

  @ApiProperty({
    description: 'SubCategory ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  // @IsUUID('4', { message: 'subCategoryId must be a valid UUID' })
  @IsNotEmpty({ message: 'subCategoryId is required' })
  subCategoryId: string;
}
