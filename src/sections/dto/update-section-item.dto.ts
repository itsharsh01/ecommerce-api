import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class UpdateSectionItemDto {
  @ApiProperty({
    description: 'Sort order (lower numbers appear first)',
    example: 2,
    required: false,
  })
  @IsInt({ message: 'sortOrder must be an integer' })
  @IsOptional()
  @Min(0, { message: 'sortOrder must be greater than or equal to 0' })
  sortOrder?: number;

  @ApiProperty({
    description: 'Is item active',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
