import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ContentTranslation } from './translation.model';
import { TranslationService } from './translation.service';
import { TranslationInterceptor } from './translation.interceptor';
import { TranslationFilter } from './translation.filter';

@Module({
  imports: [SequelizeModule.forFeature([ContentTranslation])],
  providers: [
    TranslationService,
    { provide: APP_INTERCEPTOR, useClass: TranslationInterceptor },
    { provide: APP_FILTER, useClass: TranslationFilter },
  ],
  exports: [TranslationService],
})
export class TranslationModule {}
