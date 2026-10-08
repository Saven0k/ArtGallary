import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/cart.dto';
import { ValidationPipe } from '../pipes/validation.pipe';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@UsePipes(ValidationPipe)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Получить корзину текущего пользователя' })
  @ApiOkResponse({ description: 'CartResponse' })
  getCart(@CurrentUser() user: { id: number }) {
    return this.cartService.getCart(Number(user.id));
  }

  @Post('items')
  @ApiOperation({ summary: 'Добавить картину в корзину' })
  addItem(@CurrentUser() user: { id: number }, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(Number(user.id), dto.artId);
  }

  @Delete('items/:artId')
  @ApiOperation({ summary: 'Удалить картину из корзины' })
  removeItem(
    @CurrentUser() user: { id: number },
    @Param('artId', ParseIntPipe) artId: number,
  ) {
    return this.cartService.removeItem(Number(user.id), artId);
  }

  @Delete()
  @ApiOperation({ summary: 'Очистить корзину' })
  clear(@CurrentUser() user: { id: number }) {
    return this.cartService.clear(Number(user.id));
  }
}
