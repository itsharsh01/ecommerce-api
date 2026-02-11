import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SectionItemService } from './section-item.service';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Section Items')
@Controller('section-items')
export class SectionItemController {
  constructor(private readonly sectionItemService: SectionItemService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get section item by ID' })
  @ApiParam({
    name: 'id',
    description: 'Section Item ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.sectionItemService.findOne(id);
      return {
        msg: 'Section item retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update section item (sortOrder / active)' })
  @ApiParam({
    name: 'id',
    description: 'Section Item ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateSectionItemDto,
  ) {
    try {
      const result = await this.sectionItemService.update(id, updateItemDto);
      return {
        msg: 'Section item updated successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove item from section' })
  @ApiParam({
    name: 'id',
    description: 'Section Item ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.sectionItemService.remove(id);
      return {
        msg: 'Section item deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}
