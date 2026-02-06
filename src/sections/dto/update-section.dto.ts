import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';

export class UpdateSectionDto {
  @ApiProperty({
    description: 'Section name',
    example: 'Top Selling Products',
    required: false,
    maxLength: 255,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Section key (unique identifier, lowercase with hyphens)',
    example: 'top-selling',
    required: false,
    maxLength: 100,
  })
  @IsString({ message: 'Key must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Key must not exceed 100 characters' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must contain only lowercase letters, numbers, and hyphens',
  })
  key?: string;

  @ApiProperty({
    description: 'Is section active',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
