import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('otps')
@Index(['email', 'otp']) // Index for faster lookups
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

