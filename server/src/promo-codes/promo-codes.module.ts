import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PromoCode } from './promo-code.model';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';

@Module({
  imports: [SequelizeModule.forFeature([PromoCode])],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
