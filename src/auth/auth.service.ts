import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import {
  formatPhoneToE164,
  validateE164Format,
  validateIndianPhone,
} from '../common/utils/phone.util';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  // Register with email and password
  async register(email: string, password: string, name: string) {
    // Check if user exists in Firebase
    const existingFirebaseUser = await this.firebaseService.getUserByEmail(email);
    if (existingFirebaseUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Firebase
    const firebaseUser = await this.firebaseService.createUser(
      email,
      password,
      name,
    );

    return {
      message: 'User created successfully. Please verify your email.',
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || name,
        emailVerified: firebaseUser.emailVerified,
      },
      // Note: Email verification should be handled on client side using Firebase Client SDK
      // The client will call sendEmailVerification() and then send the ID token back
    };
  }

  // Verify Firebase token (when user logs in from client)
  async verifyFirebaseToken(idToken: string) {
    try {
      const decodedToken = await this.firebaseService.verifyToken(idToken);

      // Generate JWT token for your API
      const payload = {
        sub: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        firebaseUid: decodedToken.uid,
        emailVerified: decodedToken.email_verified,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          emailVerified: decodedToken.email_verified,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  // Verify email (called after user clicks verification link on client)
  async verifyEmail(uid: string) {
    try {
      await this.firebaseService.updateEmailVerified(uid, true);
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to verify email');
    }
  }

  // Register with phone number
  // Note: OTP sending is handled by Firebase Client SDK on the frontend
  // This method prepares the backend for phone authentication
  async registerWithPhone(phoneNumber: string, name?: string) {
    // Format phone number to E.164 format (e.g., +918266831757)
    const formattedPhone = formatPhoneToE164(phoneNumber, '+91');

    // Validate E.164 format
    if (!validateE164Format(formattedPhone)) {
      throw new BadRequestException(
        'Invalid phone number format. Must be in E.164 format (e.g., +918266831757)',
      );
    }

    // Validate Indian phone number format (optional - remove if supporting multiple countries)
    if (!validateIndianPhone(formattedPhone)) {
      throw new BadRequestException(
        'Invalid Indian phone number. Must be in format +91 followed by 10 digits starting with 6-9 (e.g., +918266831757)',
      );
    }

    // Check if user exists with this phone number
    const existingUser = await this.firebaseService.getUserByPhoneNumber(formattedPhone);
    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Create user with phone number
    // Note: Phone verification OTP is sent by Firebase Client SDK, not Admin SDK
    const firebaseUser = await this.firebaseService.createUserWithPhone(
      formattedPhone,
      name,
    );

    return {
      message:
        'User created successfully. Please verify your phone number using OTP sent to your mobile.',
      user: {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        name: firebaseUser.displayName || name,
        phoneVerified: firebaseUser.phoneNumber ? true : false,
      },
      // Instructions for client:
      // 1. Use Firebase Client SDK: signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
      // 2. Firebase will send OTP SMS to the phone number
      // 3. User enters OTP
      // 4. Call confirmationResult.confirm(code)
      // 5. Get ID token and send to /auth/verify-phone endpoint
    };
  }

  // For phone number authentication with OTP
  // Note: Phone auth with OTP is handled on the client side using Firebase Client SDK
  // The client:
  // 1. Calls signInWithPhoneNumber() which sends OTP via SMS
  // 2. User enters OTP
  // 3. Calls confirmationResult.confirm(code)
  // 4. Gets ID token and sends it here for verification
  async verifyPhoneNumber(idToken: string) {
    try {
      // Verify the Firebase ID token from client
      const decodedToken = await this.firebaseService.verifyToken(idToken);

      // Extract phone number from token
      const phoneNumber = decodedToken.phone_number;
      if (!phoneNumber) {
        throw new BadRequestException('Phone number not found in token');
      }

      // Generate JWT token for your API
      const payload = {
        sub: decodedToken.uid,
        phoneNumber: phoneNumber,
        firebaseUid: decodedToken.uid,
        phoneVerified: true,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          uid: decodedToken.uid,
          phoneNumber: phoneNumber,
          phoneVerified: true,
        },
        message: 'Phone number verified successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token or phone verification failed');
    }
  }

  // Send OTP for phone verification (prepares for client-side Firebase phone auth)
  // Note: This is a helper endpoint. Actual OTP sending is done by Firebase Client SDK
  async initiatePhoneVerification(phoneNumber: string) {
    // Format phone number to E.164 format (e.g., +918266831757)
    const formattedPhone = formatPhoneToE164(phoneNumber, '+91');

    // Validate E.164 format
    if (!validateE164Format(formattedPhone)) {
      throw new BadRequestException(
        'Invalid phone number format. Must be in E.164 format (e.g., +918266831757)',
      );
    }

    // Validate Indian phone number format (optional - remove if supporting multiple countries)
    if (!validateIndianPhone(formattedPhone)) {
      throw new BadRequestException(
        'Invalid Indian phone number. Must be in format +91 followed by 10 digits starting with 6-9 (e.g., +918266831757)',
      );
    }

    // Check if user exists
    const existingUser = await this.firebaseService.getUserByPhoneNumber(formattedPhone);

    return {
      message:
        'Use Firebase Client SDK to send OTP. Instructions: Use signInWithPhoneNumber(phoneNumber, recaptchaVerifier)',
      phoneNumber: formattedPhone,
      userExists: !!existingUser,
      instructions: {
        step1: 'Initialize Firebase Client SDK',
        step2: 'Initialize RecaptchaVerifier',
        step3: 'Call signInWithPhoneNumber(phoneNumber, recaptchaVerifier)',
        step4: 'Firebase will send OTP SMS automatically',
        step5: 'User enters OTP',
        step6: 'Call confirmationResult.confirm(code)',
        step7: 'Get ID token and send to /auth/verify-phone',
      },
      // In production, you might want to check rate limits, etc.
    };
  }

  // Validate JWT token (for protected routes)
  async validateJwtToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}

