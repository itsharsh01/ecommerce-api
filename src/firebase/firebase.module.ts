import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');

        // Validate all required environment variables are present
        if (!projectId) {
          throw new Error(
            'FIREBASE_PROJECT_ID is missing. Please check your .env file.',
          );
        }
        if (!privateKey) {
          throw new Error(
            'FIREBASE_PRIVATE_KEY is missing. Please check your .env file.',
          );
        }
        if (!clientEmail) {
          throw new Error(
            'FIREBASE_CLIENT_EMAIL is missing. Please check your .env file.',
          );
        }

        const firebaseConfig: admin.ServiceAccount = {
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        };

        if (!admin.apps.length) {
          return admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
          });
        }
        return admin.app();
      },
      inject: [ConfigService],
    },
    FirebaseService,
  ],
  exports: [FirebaseService, 'FIREBASE_ADMIN'],
})
export class FirebaseModule {}

