import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'

import { ProductService } from './product.service'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateProductDto,
  ) {
    return this.productService.create(
      dto,
    )
  }

  @Get('store/:storeId')
  findAll(
    @Param('storeId')
    storeId: string,
  ) {
    return this.productService.findAll(
      storeId,
    )
  }

  @Get('barcode/:barcode')
  findByBarcode(
    @Param('barcode')
    barcode: string,
  ) {
    return this.productService.findByBarcode(
      barcode,
    )
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.productService.findOne(
      id,
    )
  }

  @Post(':id/generate-barcode')
  generateBarcode(
    @Param('id')
    id: string,
  ) {
    return this.productService.generateBarcode(
      id,
    )
  }

  @Post(
    'store/:storeId/generate-barcodes',
  )
  generateAllBarcodes(
    @Param('storeId')
    storeId: string,
  ) {
    return this.productService.generateAllBarcodes(
      storeId,
    )
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProductDto,
  ) {
    return this.productService.update(
      id,
      dto,
    )
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id')
    id: string,

    @Body()
    body: {
      stock: number
    },
  ) {
    return this.productService.updateStock(
      id,
      body.stock,
    )
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.productService.remove(
      id,
    )
  }
}