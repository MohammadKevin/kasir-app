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
import { TableService } from './table.service'
import { CreateTableDto } from './dto/create-table.dto'
import { UpdateTableDto } from './dto/update-table.dto'

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tableService.create(dto)
  }

  @Get('store/:storeId')
  findAll(@Param('storeId') storeId: string) {
    return this.tableService.findAll(storeId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tableService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tableService.remove(id)
  }
}
