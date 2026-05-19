import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReportService } from './report.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
  ) {}

  @Get('sales')
  salesReport(
    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,

    @Query('outletId')
    outletId?: string,
  ) {
    return this.reportService.salesReport(
      startDate,
      endDate,
      outletId,
    );
  }

  @Get('expenses')
  expenseReport(
    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,

    @Query('outletId')
    outletId?: string,
  ) {
    return this.reportService.expenseReport(
      startDate,
      endDate,
      outletId,
    );
  }

  @Get('profit-loss')
  profitLossReport(
    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,

    @Query('outletId')
    outletId?: string,
  ) {
    return this.reportService.profitLossReport(
      startDate,
      endDate,
      outletId,
    );
  }

  @Get('transaction/:id')
  transactionDetail(
    @Param('id') id: string,
  ) {
    return this.reportService.transactionDetail(
      id,
    );
  }

  @Get('dashboard-summary')
  dashboardSummary() {
    return this.reportService.dashboardSummary();
  }

  @Get('top-products')
  topProducts() {
    return this.reportService.topProducts();
  }

  @Get('low-stock')
  lowStockReport() {
    return this.reportService.lowStockReport();
  }

  @Get('cashier-performance')
  cashierPerformance() {
    return this.reportService.cashierPerformance();
  }

  @Get('returns')
  returnReport() {
    return this.reportService.returnReport();
  }

  @Get('charts/daily-sales')
  dailySalesChart() {
    return this.reportService.dailySalesChart();
  }

  @Get('charts/monthly-sales')
  monthlySalesChart() {
    return this.reportService.monthlySalesChart();
  }
}