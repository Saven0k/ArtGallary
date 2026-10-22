import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartHistory } from './cart-history.model';
import { CartHistoryService } from './cart-history.service';
import { CartHistoryController } from './cart-history.controller';
import { Cart } from '../cart/cart.model';
import { User } from '../users/users.model';
import { Art } from '../arts/arts.model';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';

@Module({
  controllers: [CartHistoryController],
  providers: [CartHistoryService],
  imports: [
    SequelizeModule.forFeature([CartHistory, Cart, User, Art]),
    PromoCodesModule,
  ],
  exports: [CartHistoryService],
})
export class CartHistoryModule {}
