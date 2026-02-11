import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than 0' })
  limit?: number;

  @ApiProperty({
    description: 'Search by product name',
    example: 'iPhone',
    required: false,
  })
  @IsString({ message: 'Search must be a string' })
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by brand ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  @IsOptional()
  brandId?: string;

  @ApiProperty({
    description: 'Filter by subCategory ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'subCategoryId must be a valid UUID' })
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({
    description: 'Minimum price filter',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minPrice must be a number' })
  @Min(0, { message: 'minPrice must be greater than or equal to 0' })
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    example: 100000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxPrice must be a number' })
  @Min(0, { message: 'maxPrice must be greater than or equal to 0' })
  maxPrice?: number;
}
