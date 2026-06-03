import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common'

import express from 'express'

import { ReportService } from './report.service'

@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
  ) {}

  @Get('sales/:storeId')
  sales(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.sales(
      storeId,
    )
  }

  @Get('expenses/:storeId')
  expenses(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.expenses(
      storeId,
    )
  }

  @Get('products/:storeId')
  products(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.products(
      storeId,
    )
  }

  @Get('shifts/:storeId')
  shifts(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.shifts(
      storeId,
    )
  }

  @Get('purchases/:storeId')
  purchases(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.purchases(
      storeId,
    )
  }

  @Get('stock-movements/:storeId')
  stockMovements(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.stockMovements(
      storeId,
    )
  }

  @Get('profit/:storeId')
  profit(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.profit(
      storeId,
    )
  }

  @Get('sales/:storeId/excel')
  async salesExcel(
    @Param('storeId')
    storeId: string,

    @Res()
    res: express.Response,
  ) {
    const buffer =
      await this.reportService.salesExcel(
        storeId,
      )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales.xlsx',
    )

    res.send(buffer)
  }

  @Get('sales/:storeId/pdf')
  async salesPdf(
    @Param('storeId')
    storeId: string,

    @Res()
    res: express.Response,
  ) {
    const buffer =
      await this.reportService.salesPdf(
        storeId,
      )

    res.setHeader(
      'Content-Type',
      'application/pdf',
    )

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales.pdf',
    )

    res.send(buffer)
  }
}