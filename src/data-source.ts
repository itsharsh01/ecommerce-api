import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
// Import all entities - add new entities here when you create them
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/sub-category.entity';
import { Brand } from './entities/brand.entity';
// import { Product } from './entities/product.entity';
// import { Order } from './entities/order.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // List all your entities here
  // When you create a new entity file, just import it above and add it to this array
  entities: [
    User,
    Otp,
    Category,
    SubCategory,
    Brand,
    // Product,
    // Order,
  ],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false, // Always false for migrations (use migrations instead)
  logging: true,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

