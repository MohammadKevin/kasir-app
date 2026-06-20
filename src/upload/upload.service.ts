import { Injectable, BadRequestException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),

      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),

      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: Express.Multer.File, folder = 'storeflow') {
    if (!file) {
      throw new BadRequestException('File wajib diisi');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,

            resource_type: 'auto',
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result as UploadApiResponse);
          },
        )
        .end(file.buffer);
    });
  }

  async delete(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
