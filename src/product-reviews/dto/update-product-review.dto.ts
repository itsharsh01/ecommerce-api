import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateProductReviewDto {
  @ApiProperty({
    description: 'Rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Review title',
    example: 'Updated review title',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title?: string;

  @ApiProperty({
    description: 'Review comment',
    example: 'Updated review comment',
    required: false,
  })
  @IsString({ message: 'Comment must be a string' })
  @IsOptional()
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  comment?: string;

  @ApiProperty({
    description: 'Is review active (admin only)',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
