import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    // Verify connection in development
    if (process.env.NODE_ENV !== 'production') {
      this.transporter.verify().then(() => {
        this.logger.log('Email service is ready to send emails');
      }).catch((error) => {
        this.logger.warn('Email service configuration error:', error.message);
        this.logger.warn('Emails will be logged to console in development mode');
      });
    }
  }

  /**
   * Load email template from file
   */
  private loadTemplate(templateName: string, variables: Record<string, string>): string {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'common',
        'templates',
        `${templateName}.html`
      );

      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace variables in template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key]);
      });

      return template;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      // Return a simple fallback template
      return this.getFallbackTemplate(variables);
    }
  }

  /**
   * Fallback template if file loading fails
   */
  private getFallbackTemplate(variables: Record<string, string>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Email Verification</h2>
          <p>Hello,</p>
          <p>Your verification OTP is: <strong style="font-size: 24px; color: #4CAF50;">${variables.otp}</strong></p>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email verification OTP
   */
  async sendVerificationOTP(email: string, otp: string, firstName: string): Promise<void> {
    const templateVariables = {
      firstName,
      otp,
      expirationTime: '10 minutes',
    };

    const htmlContent = this.loadTemplate('email-verification', templateVariables);

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
      to: email,
      subject: 'Verify Your Email Address',
      html: htmlContent,
    };

    try {
      // In development, if SMTP is not configured, log to console
      if (!this.configService.get<string>('SMTP_USER') || !this.configService.get<string>('SMTP_PASS')) {
        this.logger.warn('SMTP not configured. Email would be sent to:', email);
        this.logger.warn('OTP:', otp);
        this.logger.warn('Email content:', htmlContent);
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      // In development, log the OTP instead of throwing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`OTP for ${email}: ${otp}`);
      } else {
        throw error;
      }
    }
  }
}

