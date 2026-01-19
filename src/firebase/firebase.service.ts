import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private firebaseAdmin: admin.app.App) {}

  getAuth() {
    return this.firebaseAdmin.auth();
  }

  // Verify ID Token (from client)
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.firebaseAdmin.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Create user with email and password
  async createUser(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.firebaseAdmin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    try {
      return await this.firebaseAdmin.auth().getUserByEmail(email);
    } catch (error) {
      return null;
    }
  }

  // Get user by UID
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAdmin.auth().getUser(uid);
    } catch (error) {
      throw new Error(`User not found: ${error.message}`);
    }
  }

  // Update user email verification status
  async updateEmailVerified(
    uid: string,
    emailVerified: boolean,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAdmin.auth().updateUser(uid, {
        emailVerified,
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Update user display name
  async updateUser(uid: string, data: Partial<admin.auth.UpdateRequest>): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAdmin.auth().updateUser(uid, data);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseAdmin.auth().deleteUser(uid);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Custom token generation (for server-side auth)
  async createCustomToken(
    uid: string,
    additionalClaims?: object,
  ): Promise<string> {
    try {
      return await this.firebaseAdmin
        .auth()
        .createCustomToken(uid, additionalClaims);
    } catch (error) {
      throw new Error(`Failed to create custom token: ${error.message}`);
    }
  }

  // Set custom user claims (for role-based access)
  async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    try {
      await this.firebaseAdmin.auth().setCustomUserClaims(uid, customClaims);
    } catch (error) {
      throw new Error(`Failed to set custom claims: ${error.message}`);
    }
  }

  // Get user by phone number
  async getUserByPhoneNumber(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
    try {
      return await this.firebaseAdmin.auth().getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      return null;
    }
  }

  // Create user with phone number
  async createUserWithPhone(
    phoneNumber: string,
    displayName?: string,
  ): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.firebaseAdmin.auth().createUser({
        phoneNumber,
        displayName,
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create user with phone: ${error.message}`);
    }
  }

  // Update user phone number
  async updatePhoneNumber(uid: string, phoneNumber: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAdmin.auth().updateUser(uid, {
        phoneNumber,
      });
    } catch (error) {
      throw new Error(`Failed to update phone number: ${error.message}`);
    }
  }
}

