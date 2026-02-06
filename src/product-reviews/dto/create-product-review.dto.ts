import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateProductReviewDto {
  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating: number;

  @ApiProperty({
    description: 'Review title',
    example: 'Great product!',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title?: string;

  @ApiProperty({
    description: 'Review comment',
    example: 'This product exceeded my expectations. Highly recommended!',
    required: false,
  })
  @IsString({ message: 'Comment must be a string' })
  @IsOptional()
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  comment?: string;
}
