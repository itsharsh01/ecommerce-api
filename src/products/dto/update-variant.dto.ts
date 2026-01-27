import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVariantDto {
  @ApiProperty({
    description: 'SKU (Stock Keeping Unit)',
    example: 'IPH15PRO-256-BLK',
    required: false,
    maxLength: 100,
  })
  @IsString({ message: 'SKU must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'SKU must not exceed 100 characters' })
  sku?: string;

  @ApiProperty({
    description: 'Variant attributes (size, color, RAM, etc.)',
    example: { size: '256GB', color: 'Black', ram: '8GB' },
    required: false,
  })
  @IsObject({ message: 'Attributes must be an object' })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiProperty({
    description: 'Selling price',
    example: 109999.99,
    required: false,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsOptional()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number;

  @ApiProperty({
    description: 'Maximum Retail Price (MRP)',
    example: 129999.99,
    required: false,
  })
  @IsNumber({}, { message: 'MRP must be a number' })
  @IsOptional()
  @Min(0, { message: 'MRP must be greater than or equal to 0' })
  mrp?: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 150,
    required: false,
  })
  @IsNumber({}, { message: 'Stock must be a number' })
  @IsOptional()
  @Min(0, { message: 'Stock must be greater than or equal to 0' })
  stock?: number;

  @ApiProperty({
    description: 'Is variant active',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
