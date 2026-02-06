import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../entities/section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  async create(createSectionDto: CreateSectionDto) {
    try {
      // Check if key already exists
      const existingKey = await this.sectionRepository.findOne({
        where: { key: createSectionDto.key },
      });

      if (existingKey) {
        throw new ConflictException('Section with this key already exists');
      }

      const section = this.sectionRepository.create({
        name: createSectionDto.name,
        key: createSectionDto.key,
        isActive: createSectionDto.isActive ?? true,
      });

      const savedSection = await this.sectionRepository.save(section);

      if (!savedSection) {
        throw new InternalServerErrorException('Failed to create section');
      }

      return savedSection;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to create section',
      );
    }
  }

  async findAll() {
    try {
      const sections = await this.sectionRepository.find({
        order: { createdAt: 'DESC' },
      });

      return sections;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch sections',
      );
    }
  }

  async findOne(id: string) {
    try {
      const section = await this.sectionRepository.findOne({
        where: { id },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      return section;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch section',
      );
    }
  }

  async findByKey(key: string) {
    try {
      const section = await this.sectionRepository.findOne({
        where: { key, isActive: true },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      return section;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to fetch section',
      );
    }
  }

  async update(id: string, updateSectionDto: UpdateSectionDto) {
    try {
      const section = await this.sectionRepository.findOne({
        where: { id },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      // If key is being updated, check for conflicts
      if (updateSectionDto.key && updateSectionDto.key !== section.key) {
        const existingKey = await this.sectionRepository.findOne({
          where: { key: updateSectionDto.key },
        });

        if (existingKey && existingKey.id !== id) {
          throw new ConflictException('Section with this key already exists');
        }
      }

      // Update fields
      Object.assign(section, updateSectionDto);

      const updatedSection = await this.sectionRepository.save(section);

      if (!updatedSection) {
        throw new InternalServerErrorException('Failed to update section');
      }

      return updatedSection;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to update section',
      );
    }
  }

  async remove(id: string) {
    try {
      const section = await this.sectionRepository.findOne({
        where: { id },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      await this.sectionRepository.remove(section);

      return { message: 'Section deleted successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Failed to delete section',
      );
    }
  }
}
