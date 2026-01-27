import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum ModuleType {
  PRODUCT = 'product',
  VARIANT = 'variant',
  PRODUCT_REVIEW = 'product_review',
  SECTION = 'section',
  BRAND = 'brand',
}

export enum ImageType {
  PRIMARY = 'primary',
  GALLERY = 'gallery',
  THUMBNAIL = 'thumbnail',
  LOGO = 'logo',
  BANNER = 'banner',
}

@Entity('images')
@Index(['moduleType', 'module_id'])
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 100 })
  bucket: string;

  @Column({ type: 'varchar', length: 500 })
  objectKey: string;

  @Column({
    type: 'enum',
    enum: ModuleType,
  })
  moduleType: ModuleType;

  @Column({ type: 'uuid' })
  module_id: string;

  @Column({
    type: 'enum',
    enum: ImageType,
  })
  type: ImageType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
