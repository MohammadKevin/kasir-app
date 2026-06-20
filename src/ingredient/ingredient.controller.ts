import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { IngredientService } from './ingredient.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Controller('ingredients')
@UseGuards(JwtAuthGuard)
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientService.create(dto);
  }

  @Get('store/:storeId')
  findAll(@Param('storeId') storeId: string) {
    return this.ingredientService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ingredientService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredientService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingredientService.remove(id);
  }

  @Get('recipe/:productId')
  getRecipe(@Param('productId') productId: string) {
    return this.ingredientService.getRecipe(productId);
  }

  @Post('recipe/:productId')
  updateRecipe(
    @Param('productId') productId: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.ingredientService.updateRecipe(productId, dto);
  }
}
