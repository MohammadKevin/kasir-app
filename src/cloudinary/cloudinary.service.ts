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

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString(
        'base64',
      )}`;

      const result = await cloudinary.uploader.upload(base64File, {
        folder: 'kasir-app/products',
      });

      return result.secure_url;
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException('Upload image gagal');
    }
  }
}
