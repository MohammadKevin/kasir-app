import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

      api_key: process.env.CLOUDINARY_API_KEY,

      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'kasir-app/products',
      });

      return result.secure_url;
    } catch {
      throw new InternalServerErrorException('Upload image gagal');
    }
  }
}
