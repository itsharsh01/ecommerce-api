import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '../../entities/product.entity';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus, {
    message: 'status must be one of: draft, active, inactive',
  })
  @IsNotEmpty({ message: 'status is required' })
  status: ProductStatus;
}
