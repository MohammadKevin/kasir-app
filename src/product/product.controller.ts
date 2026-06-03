import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
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
  ) { }

  private onlyAdmin(
    req: any,
  ) {
    if (
      req.user?.type !==
      'ADMIN'
    ) {
      throw new UnauthorizedException(
        'Hanya admin yang dapat melakukan aksi ini',
      )
    }
  }

  @Post()
  create(
    @Req() req: any,

    @Body()
    dto: CreateProductDto,
  ) {
    this.onlyAdmin(req)

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

  @Get('barcode/:barcode')
  findByBarcode(
    @Param('barcode')
    barcode: string,
  ) {
    return this.productService.findByBarcode(
      barcode,
    )
  }

  @Patch(':id')
  update(
    @Req() req: any,

    @Param('id')
    id: string,

    @Body()
    dto: UpdateProductDto,
  ) {
    this.onlyAdmin(req)

    return this.productService.update(
      id,
      dto,
    )
  }

  @Delete(':id')
  remove(
    @Req() req: any,

    @Param('id')
    id: string,
  ) {
    this.onlyAdmin(req)

    return this.productService.remove(
      id,
    )
  }
}