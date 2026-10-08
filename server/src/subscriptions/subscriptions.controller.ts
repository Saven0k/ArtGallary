import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscriptions.service';
import {
  PurchaseSubscriptionDto,
  ConfirmPaymentDto,
} from './dto/subscription.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ValidationPipe } from '../pipes/validation.pipe';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAccessGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('me')
  @Roles(Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Получить информацию о моей подписке' })
  async getMySubscription(@CurrentUser('id') userId: number) {
    return this.subscriptionService.getSubscriptionInfo(userId);
  }

  @Post('purchase')
  @Roles(Role.Author)
  @ApiOperation({ summary: 'Инициировать покупку подписки' })
  async purchaseSubscription(
    @CurrentUser('id') userId: number,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    return this.subscriptionService.initiatePurchase(userId, dto);
  }

  @Post('confirm')
  @Roles(Role.Author)
  @ApiOperation({ summary: 'Подтвердить оплату подписки' })
  async confirmPayment(
    @CurrentUser('id') userId: number,
    @Body() confirmDto: ConfirmPaymentDto,
  ) {
    return this.subscriptionService.confirmPayment(userId, confirmDto);
  }

  @Delete('cancel')
  @Roles(Role.Author)
  @ApiOperation({ summary: 'Отменить подписку' })
  async cancelSubscription(@CurrentUser('id') userId: number) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Get('plans')
  @Roles(Role.Author, Role.Admin, Role.Moderator, Role.User, Role.Visitor)
  @ApiOperation({ summary: 'Получить все доступные планы' })
  getAvailablePlans() {
    return this.subscriptionService.getAvailablePlans();
  }
}
