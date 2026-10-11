import '../load-env';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { InjectConnection, SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { ContentTranslation } from './translation.model';
import { TranslationService } from './translation.service';
import { ContentLanguage, translateContent } from './translation-text';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [ContentTranslation],
      synchronize: false,
      logging: false,
    }),
    SequelizeModule.forFeature([ContentTranslation]),
  ],
  providers: [TranslationService],
})
class TranslationCliModule {
  constructor(@InjectConnection() readonly database: Sequelize) {}
}

async function main() {
  if (!['migrate', 'warm'].includes(process.argv[2]))
    throw new Error('Use: migrate | warm');
  if (process.argv[3] && !['ru', 'en', 'zh'].includes(process.argv[3]))
    throw new Error('Language must be ru, en or zh');
  process.env.TRANSLATION_ENABLED = 'true';
  const app = await NestFactory.createApplicationContext(TranslationCliModule, {
    logger: ['error', 'warn'],
  });
  try {
    await ContentTranslation.sync();
    if (process.argv[2] === 'migrate') {
      console.log('content_translations ready');
      return;
    }
    const translator = app.get(TranslationService);
    const database = app.get(TranslationCliModule).database;
    const tables = [
      ['arts', 'title, description, specifications, moderate'],
      ['events', 'title, description'],
      ['author_profiles', 'biography, moderate'],
      ['genres', 'title, description'],
      ['styles', 'name, description'],
      ['professions', 'name, description'],
      ['art_types', 'name, description'],
      ['tags', 'name'],
      ['countries', 'name_ru, name_en'],
    ];
    const requested = process.argv[3];
    const targets: ContentLanguage[] =
      requested === 'ru' || requested === 'en' || requested === 'zh'
        ? [requested]
        : ['ru', 'en', 'zh'];
    let missing = 0;
    const check = async (text: string, language: ContentLanguage) => {
      const result = await translator.translateResult(text, language);
      if (!result.complete) missing++;
      return result.text;
    };
    for (const [table, columns] of tables) {
      const rows = await database.query<Record<string, unknown>>(
        `SELECT ${columns} FROM "${table}"`,
        { type: QueryTypes.SELECT },
      );
      console.log(`${table}: ${rows.length}`);
      for (const row of rows) {
        for (const language of targets)
          await translateContent(
            row,
            language,
            `/${table.replace('_', '-')}`,
            (text) => check(text, language),
          );
      }
    }
    const cities = await database.query<Record<string, unknown>>(
      'SELECT name_ru, name_en, region FROM cities WHERE id IN (SELECT city_id FROM arts WHERE city_id IS NOT NULL UNION SELECT city_id FROM users WHERE city_id IS NOT NULL)',
      { type: QueryTypes.SELECT },
    );
    for (const city of cities) {
      for (const language of targets)
        await translateContent(city, language, '/location/cities', (text) =>
          check(text, language),
        );
    }
    console.log(`Pretranslation finished; unavailable: ${missing}`);
    if (missing) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Translation command failed',
  );
  process.exitCode = 1;
});
