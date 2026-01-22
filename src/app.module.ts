import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
      TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
}),
    FirebaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) { }

  onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('✅ Database connected successfully');
    } else {
      console.error('❌ Failed to connect to the database');
    }
  }
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(LoggerMiddleware).forRoutes('*');
  // }
}
