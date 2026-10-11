import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthorsModule } from '../authors/authors.module';
import { ArtsModule } from '../arts/arts.module';
import { User } from '../users/users.model';
import { Art } from '../arts/arts.model';
import { AuthorProfile } from '../authors/author.model';
import {
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
} from './telegram.models';
import { TelegramApi } from './telegram-api.service';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    AuthorsModule,
    ArtsModule,
    SequelizeModule.forFeature([
      User,
      Art,
      AuthorProfile,
      TelegramAccount,
      TelegramDelivery,
      TelegramBotState,
    ]),
  ],
  providers: [TelegramApi, TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
