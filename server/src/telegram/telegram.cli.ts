import '../load-env';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
} from './telegram.models';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [TelegramAccount, TelegramDelivery, TelegramBotState],
      synchronize: false,
      logging: false,
    }),
  ],
})
class TelegramMigrationModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(
    TelegramMigrationModule,
    { logger: ['error', 'warn'] },
  );
  try {
    for (const model of [TelegramAccount, TelegramDelivery, TelegramBotState])
      await model.sync();
    console.log('Telegram tables ready');
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Telegram migration failed',
  );
  process.exitCode = 1;
});
