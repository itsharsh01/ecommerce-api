import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateSectionItemDto {
  @ApiProperty({
    description: 'Product ID (required if variantId is not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @ValidateIf((o) => !o.variantId)
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'Variant ID (required if productId is not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @ValidateIf((o) => !o.productId)
  @IsUUID('4', { message: 'variantId must be a valid UUID' })
  @IsOptional()
  variantId?: string;

  @ApiProperty({
    description: 'Sort order (lower numbers appear first)',
    example: 1,
    default: 0,
    required: false,
  })
  @IsInt({ message: 'sortOrder must be an integer' })
  @IsOptional()
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;

  @ApiProperty({
    description: 'Is item active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
