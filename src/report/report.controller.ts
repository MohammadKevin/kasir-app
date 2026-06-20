import { Controller, Get, Param, Query, Res } from '@nestjs/common';

import express from 'express';

import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales/:storeId')
  sales(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.sales(storeId, startDate, endDate);
  }

  @Get('expenses/:storeId')
  expenses(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.expenses(storeId, startDate, endDate);
  }

  @Get('products/:storeId')
  products(
    @Param('storeId')
    storeId: string,
  ) {
    return this.reportService.products(storeId);
  }

  @Get('shifts/:storeId')
  shifts(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.shifts(storeId, startDate, endDate);
  }

  @Get('purchases/:storeId')
  purchases(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.purchases(storeId, startDate, endDate);
  }

  @Get('stock-movements/:storeId')
  stockMovements(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.stockMovements(storeId, startDate, endDate);
  }

  @Get('profit/:storeId')
  profit(
    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.reportService.profit(storeId, startDate, endDate);
  }

  @Get('sales-by-outlet/:storeId')
  salesByOutlet(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByOutlet(storeId, startDate, endDate);
  }

  @Get('sales-by-date/:storeId')
  salesByDate(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByDate(storeId, startDate, endDate);
  }

  @Get('sales-by-hour/:storeId')
  salesByHour(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByHour(storeId, startDate, endDate);
  }

  @Get('sales-by-category/:storeId')
  salesByCategory(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByCategory(storeId, startDate, endDate);
  }

  @Get('sales-by-customer/:storeId')
  salesByCustomer(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByCustomer(storeId, startDate, endDate);
  }

  @Get('sales-by-payment-method/:storeId')
  salesByPaymentMethod(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.salesByPaymentMethod(storeId, startDate, endDate);
  }

  @Get('taxes/:storeId')
  taxes(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.taxes(storeId, startDate, endDate);
  }

  @Get('promos/:storeId')
  promos(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.promos(storeId, startDate, endDate);
  }

  @Get('daily-profit/:storeId')
  dailyProfit(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.dailyProfit(storeId, startDate, endDate);
  }

  @Get('product-profit/:storeId')
  productProfit(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.productProfit(storeId, startDate, endDate);
  }

  @Get('attendance/:storeId')
  attendance(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.attendance(storeId, startDate, endDate);
  }

  @Get('commission/:storeId')
  commission(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.commission(storeId, startDate, endDate);
  }

  @Get('sales/:storeId/excel')
  async salesExcel(
    @Res()
    res: express.Response,

    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    const buffer = await this.reportService.salesExcel(
      storeId,
      startDate,
      endDate,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');

    res.send(buffer);
  }

  @Get('sales/:storeId/pdf')
  async salesPdf(
    @Res()
    res: express.Response,

    @Param('storeId')
    storeId: string,

    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    const buffer = await this.reportService.salesPdf(
      storeId,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader('Content-Disposition', 'attachment; filename=sales.pdf');

    res.send(buffer);
  }
}
