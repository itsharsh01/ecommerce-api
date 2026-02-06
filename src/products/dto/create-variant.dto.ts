import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({
    description: 'SKU (Stock Keeping Unit)',
    example: 'IPH15PRO-128-BLK',
    maxLength: 100,
  })
  @IsString({ message: 'SKU must be a string' })
  @IsNotEmpty({ message: 'SKU is required' })
  @MaxLength(100, { message: 'SKU must not exceed 100 characters' })
  sku: string;

  @ApiProperty({
    description: 'Variant attributes (size, color, RAM, etc.)',
    example: { size: '128GB', color: 'Black', ram: '8GB' },
    required: false,
  })
  @IsObject({ message: 'Attributes must be an object' })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiProperty({
    description: 'Selling price',
    example: 99999.99,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiProperty({
    description: 'Maximum Retail Price (MRP)',
    example: 119999.99,
    required: false,
  })
  @IsNumber({}, { message: 'MRP must be a number' })
  @IsOptional()
  @Min(0, { message: 'MRP must be greater than or equal to 0' })
  mrp?: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    default: 0,
  })
  @IsNumber({}, { message: 'Stock must be a number' })
  @IsOptional()
  @Min(0, { message: 'Stock must be greater than or equal to 0' })
  stock?: number;

  @ApiProperty({
    description: 'Is variant active',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
