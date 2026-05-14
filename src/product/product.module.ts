import { Module } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],

  controllers: [ProductController],

  providers: [ProductService],

  exports: [ProductService],
})
export class ProductModule {}
