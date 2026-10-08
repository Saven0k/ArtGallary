import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CartHistoryService } from './cart-history.service';
import { ValidationPipe } from '../pipes/validation.pipe';
import {
  CheckoutDto,
  HistoryFilterDto,
  UpdateStatusDto,
} from './dto/cart-history.dto';

@ApiTags('cart-history')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@UsePipes(ValidationPipe)
@Controller('cart-history')
export class CartHistoryController {
  constructor(private readonly service: CartHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'История покупок текущего пользователя' })
  @ApiOkResponse({ description: 'OrderHistoryResponse' })
  getHistory(
    @CurrentUser() user: { id: number },
    @Query() filter: HistoryFilterDto,
  ) {
    return this.service.getHistory(Number(user.id), filter.status);
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Оформить заказ: перенести корзину в историю',
  })
  checkout(@CurrentUser() user: { id: number }, @Body() dto: CheckoutDto) {
    return this.service.checkout(Number(user.id), dto);
  }

  @Patch(':id/status')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Обновить статус заказа (только админ/модератор)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
