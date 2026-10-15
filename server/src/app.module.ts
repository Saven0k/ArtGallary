import { GALLERY_MODELS } from './database/models';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ArtsModule } from './arts/arts.module';
import { AuthModule } from './auth/auth.module';
import { GenresModule } from './genres/genres.module';
import { FilesModule } from './files/files.module';
import { StylesModule } from './styles/styles.module';
import { PasswordModule } from './password/password.module';

import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ModeratorsModule } from './moderators/moderators.module';
import { ArtTypesModule } from './art-types/art-types.module';
import { ProfessionsModule } from './professions/professions.module';
import { LocationModule } from './location/location.module';
import { TagsModule } from './tags/tags.module';
import { SubscriptionModule } from './subscriptions/subscriptions.module';
import { StatsModule } from './stats/stats.module';
import { AuthorsModule } from './authors/authors.module';
import { NotificationModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { CartModule } from './cart/cart.module';
import { CartHistoryModule } from './cart-history/cart-history.module';
import { SiteModule } from './site/site.module';
import { MailModule } from './mail/mail.module';
import { HealthController } from './health.controller';
import { TranslationModule } from './translation/translation.module';
import { TelegramModule } from './telegram/telegram.module';

const dbSync =
  process.env.DB_SYNC ??
  (process.env.NODE_ENV === 'production' ? 'false' : 'create');

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error'],
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('MyApp', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/app.log',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
          tailable: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
          tailable: true,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      // .production.env / .development.env (по NODE_ENV), затем .env как общий fallback.
      // Переменные, уже заданные в окружении процесса (pm2, docker), имеют приоритет.
      envFilePath: [
        ...(process.env.NODE_ENV !== 'production' ? ['dev.env'] : []),
        `.${process.env.NODE_ENV || 'development'}.env`,
        '.env',
      ],
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: GALLERY_MODELS,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      sync: dbSync === 'false' ? undefined : { alter: dbSync === 'alter' },
      synchronize: dbSync !== 'false',
      autoLoadModels: true,
    }),
    UsersModule,
    ArtsModule,
    AuthModule,
    FilesModule,
    StylesModule,
    AuthorsModule,
    PasswordModule,
    ModeratorsModule,
    ArtTypesModule,
    GenresModule,
    LocationModule,
    ProfessionsModule,
    TagsModule,
    SubscriptionModule,
    StatsModule,
    NotificationModule,
    EventsModule,
    CartModule,
    CartHistoryModule,
    SiteModule,
    MailModule,
    TranslationModule,
    TelegramModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
