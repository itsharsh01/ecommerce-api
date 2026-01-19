import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class VerifyTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  uid: string;
}

export class RegisterWithPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+91|0|91)?[6-9]\d{9}$/, {
    message:
      'Phone number must be a valid Indian mobile number (e.g., +918266831757, 8266831757, or 08266831757)',
  })
  phoneNumber: string;

  @IsString()
  name?: string;
}

export class InitiatePhoneVerificationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+91|0|91)?[6-9]\d{9}$/, {
    message:
      'Phone number must be a valid Indian mobile number (e.g., +918266831757, 8266831757, or 08266831757)',
  })
  phoneNumber: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyFirebaseToken(verifyTokenDto.idToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.uid);
  }

  @Post('register-phone')
  @HttpCode(HttpStatus.CREATED)
  async registerWithPhone(@Body() registerWithPhoneDto: RegisterWithPhoneDto) {
    return this.authService.registerWithPhone(
      registerWithPhoneDto.phoneNumber,
      registerWithPhoneDto.name,
    );
  }

  @Post('initiate-phone-verification')
  @HttpCode(HttpStatus.OK)
  async initiatePhoneVerification(
    @Body() initiatePhoneDto: InitiatePhoneVerificationDto,
  ) {
    return this.authService.initiatePhoneVerification(initiatePhoneDto.phoneNumber);
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  async verifyPhone(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyPhoneNumber(verifyTokenDto.idToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req) {
    return req.user;
  }
}

