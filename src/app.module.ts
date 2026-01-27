import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './categories/category.module';
import { BrandModule } from './brands/brand.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
      TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
      ssl: {
        rejectUnauthorized: false,
      },
      // Set timezone for PostgreSQL connection using driver options
      extra: {
        // This sets the timezone for the PostgreSQL connection
        // It executes 'SET timezone' when a connection is established
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
        statement_timeout: 10000,
        // Use application_name for debugging
        application_name: 'ecommerce-api',
      },
      // This will be executed on each connection from the pool
      poolErrorHandler: (err) => {
        console.error('Database pool error:', err);
      },
    };
  },
  dataSourceFactory: async (options: DataSourceOptions) => {
    const dataSource = new DataSource(options);
    await dataSource.initialize();

    // Set timezone for all connections in the pool
    await dataSource.query("SET timezone = 'Asia/Kolkata'");

    return dataSource;
  },
  }),
    AuthModule,
    CategoryModule,
    BrandModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) { }

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('✅ Database connected successfully');

      // Set timezone for all connections
      try {
        await this.dataSource.query("SET timezone = 'Asia/Kolkata'");
        const result = await this.dataSource.query("SHOW timezone");
        console.log('🕐 Database timezone set to:', result[0].TimeZone);
      } catch (error) {
        console.error('⚠️  Failed to set database timezone:', error.message);
      }
    } else {
      console.error('❌ Failed to connect to the database');
    }
  }
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(LoggerMiddleware).forRoutes('*');
  // }
}
