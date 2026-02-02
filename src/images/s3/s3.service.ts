import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private publicUrl: string;
  private accessKeyId: string | undefined;
  private secretAccessKey: string | undefined;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'ap-south-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'elektwonik-backend';
    this.publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL') || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    this.accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    // Initialize S3Client only if credentials are available
    if (this.accessKeyId && this.secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    } else {
      this.logger.warn('AWS credentials not configured. S3 uploads will fail. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.');
    }
  }

  async onModuleInit() {
    this.logger.log(`S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`);
  }

  async uploadFile(
    objectKey: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.s3Client) {
      const errorMessage = 'AWS credentials are required. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const params: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read', // Make file publicly accessible
      };

      await this.s3Client.send(new PutObjectCommand(params));

      const url = this.getFileUrl(objectKey);
      this.logger.log(`File uploaded successfully to S3: ${objectKey}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  getFileUrl(objectKey: string): string {
    // Use custom public URL if configured, otherwise use default S3 URL
    if (this.publicUrl && !this.publicUrl.includes('${this.bucketName}')) {
      return `${this.publicUrl}/${objectKey}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
