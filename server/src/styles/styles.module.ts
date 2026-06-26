import { Module } from '@nestjs/common';
import { StylesSerivce } from './styles.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Style } from './styles.model';
import { Genre } from '../genres/genre.model';
import { TranslationModule } from 'src/translation/translation.module';
import { StylesController } from './styles.controller';

@Module({
  providers: [StylesSerivce],
  controllers: [StylesController],
  imports: [
      SequelizeModule.forFeature([Style]),
      TranslationModule
    ],
})
export class StyleModule {}
