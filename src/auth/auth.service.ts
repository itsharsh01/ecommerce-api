import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Otp } from '../entities/otp.entity';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    // Check if user exists in database
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database (email not verified yet)
    const user = await this.userRepository.save({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      emailVerified: false,
    });

    // Generate OTP
    const otp = this.generateOTP();

    // Delete any existing OTPs for this email
    await this.otpRepository.delete({ email, isUsed: false });

    // Save OTP to database
    await this.otpRepository.save({
      email,
      otp,
      isUsed: false,
    });

    // Send verification email
    await this.emailService.sendVerificationOTP(email, otp, firstName);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      msg: 'Registration successful. Please check your email for verification OTP.',
      data: {
        user: userWithoutPassword,
      },
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otp: string) {
    // Find the OTP record
    const otpRecord = await this.otpRepository.findOne({
      where: { email, otp, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check if OTP is expired (10 minutes)
    const now = new Date();
    const createdAt = new Date(otpRecord.createdAt);
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffInMinutes > 10) {
      // Mark as used even though expired
      otpRecord.isUsed = true;
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await this.otpRepository.save(otpRecord);

    // Update user email verification status
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.emailVerified = true;
    await this.userRepository.save(user);

    // Generate JWT token with user id and email
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      msg: 'Email verified successfully',
      data: {
        access_token,
        user: userWithoutPassword,
      },
    };
  }

  async login(email: string, password: string) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Generate JWT token with user id and email
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      msg: 'Login successful',
      data: {
        access_token,
        user: userWithoutPassword,
      },
    };
  }

  /**
   * Resend verification OTP
   */
  async resendVerificationOTP(email: string) {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new OTP
    const otp = this.generateOTP();

    // Delete any existing unused OTPs for this email
    await this.otpRepository.delete({ email, isUsed: false });

    // Save new OTP to database
    await this.otpRepository.save({
      email,
      otp,
      isUsed: false,
    });

    // Send verification email
    await this.emailService.sendVerificationOTP(email, otp, user.firstName);

    return {
      msg: 'Verification OTP has been resent to your email',
      data: {
        email,
        expiresIn: '10 minutes',
      },
    };
  }
}
