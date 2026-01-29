import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { Brand } from './brand.entity';
import { SubCategory } from './sub-category.entity';
import { User } from './user.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  brand_id: string;

  @Column({ type: 'uuid' })
  sub_category_id: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {eager: false })
  variants: ProductVariant[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;

  // 🔹 Product → Brand (Many products can belong to one brand)
  @ManyToOne(() => Brand, { eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  // 🔹 Product → SubCategory (Many products can belong to one subcategory)
  @ManyToOne(() => SubCategory, { eager: false })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  // 🔹 Product → User/Seller (Many products can belong to one seller)
  @ManyToOne(() => User, (user) => user.products, { eager: false })
  @JoinColumn({ name: 'seller_id' })
  seller: User;
}
