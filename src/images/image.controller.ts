import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ImageService } from './image.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload an image to AWS S3' })
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(
    @UploadedFile() file: Multer.File,
    @Body() uploadDto: UploadImageDto,
  ) {
    try {
      const result = await this.imageService.uploadImage(file, uploadDto);
      return {
        msg: 'Image uploaded successfully',
        data: result,
      };
    } catch (err) {
      console.log('err', err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }
}
