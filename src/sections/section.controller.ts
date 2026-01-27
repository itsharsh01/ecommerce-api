import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { SectionService } from './section.service';
import { SectionItemService } from './section-item.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSectionItemDto } from './dto/create-section-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sections')
@Controller('sections')
export class SectionController {
  constructor(
    private readonly sectionService: SectionService,
    private readonly sectionItemService: SectionItemService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new section' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSectionDto: CreateSectionDto) {
    try {
      const result = await this.sectionService.create(createSectionDto);
      return {
        msg: 'Section created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections' })
  @HttpCode(HttpStatus.OK)
  async findAll() {
    try {
      const result = await this.sectionService.findAll();
      return {
        msg: 'Sections retrieved successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get section by key with items (public API)' })
  @ApiParam({
    name: 'key',
    description: 'Section key',
    example: 'trending',
  })
  @HttpCode(HttpStatus.OK)
  async findByKey(@Param('key') key: string) {
    try {
      const section = await this.sectionService.findByKey(key);
      const items = await this.sectionItemService.findBySection(section.id, false);

      return {
        msg: 'Section retrieved successfully',
        data: {
          ...section,
          items,
        },
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
  @ApiOperation({ summary: 'Update section' })
  @ApiParam({
    name: 'id',
    description: 'Section ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    try {
      const result = await this.sectionService.update(id, updateSectionDto);
      return {
        msg: 'Section updated successfully',
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
  @ApiOperation({ summary: 'Delete section' })
  @ApiParam({
    name: 'id',
    description: 'Section ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.sectionService.remove(id);
      return {
        msg: 'Section deleted successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add product or variant to section' })
  @ApiParam({
    name: 'id',
    description: 'Section ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @Param('id') sectionId: string,
    @Body() createItemDto: CreateSectionItemDto,
  ) {
    try {
      const result = await this.sectionItemService.create(sectionId, createItemDto);
      return {
        msg: 'Section item created successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(err.message || 'Something went wrong');
    }
  }
}
