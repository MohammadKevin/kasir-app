import {
 Body,
 Controller,
 Get,
 Param,
 Post,
} from '@nestjs/common'

import {
 StockMovementService,
} from './stock-movement.service'

import {
 CreateStockMovementDto,
} from './dto/create-stock-movement.dto'

import {
 ScanStockDto,
} from './dto/scan-stock.dto'

@Controller(
'stock-movements',
)
export class StockMovementController {

constructor(
private readonly stockMovementService:
StockMovementService,
){}

@Post()
create(
@Body()
dto:
CreateStockMovementDto,
){
return this
.stockMovementService
.create(dto)
}

@Post(
'scan',
)
scan(
@Body()
dto:
ScanStockDto,
){

return this
.stockMovementService
.create(
dto,
)

}

@Get(
'store/:storeId',
)
findAll(
@Param(
'storeId',
)
storeId:
string,
){

return this
.stockMovementService
.findAll(
storeId,
)

}

@Get(
'product/:productId',
)
findByProduct(
@Param(
'productId',
)
productId:
string,
){

return this
.stockMovementService
.findByProduct(
productId,
)

}

}