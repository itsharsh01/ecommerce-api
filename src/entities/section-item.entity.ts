import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('section_items')
export class SectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  section_id: string;

  @Column({ type: 'uuid', nullable: true })
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  variant_id: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 🔹 SectionItem → Section (Many items belong to one section)
  @ManyToOne(() => Section, (section) => section.items, { eager: false })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  // 🔹 SectionItem → Product (Many items can reference one product)
  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // 🔹 SectionItem → ProductVariant (Many items can reference one variant)
  @ManyToOne(() => ProductVariant, { eager: false })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}
