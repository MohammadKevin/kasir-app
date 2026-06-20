import { Controller, Get, Param } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':storeId')
  overview(
    @Param('storeId')
    storeId: string,
  ) {
    return this.dashboardService.overview(storeId);
  }

  @Get(':storeId/top-products')
  topProducts(
    @Param('storeId')
    storeId: string,
  ) {
    return this.dashboardService.topProducts(storeId);
  }

  @Get(':storeId/low-stock')
  lowStock(
    @Param('storeId')
    storeId: string,
  ) {
    return this.dashboardService.lowStock(storeId);
  }
}
