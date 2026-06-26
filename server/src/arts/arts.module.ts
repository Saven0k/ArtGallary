import { Module } from '@nestjs/common';
import { ArtsService } from './arts.service';
import { ArtsController } from './arts.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from './arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { FilesModule } from '../files/files.module';
import { Type } from '../styles/type.model';
import { ArtistProfile } from '../artists/artist.model';
import { ExhibitionArt } from '../exhibitions/exhibition-art.model';
import { Exhibition } from '../exhibitions/exhibition.model';
import { TranslationModule } from 'src/translation/translation.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  providers: [ArtsService],
  controllers: [ArtsController],
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      Genre,
      Type,
      ArtistProfile,
      ExhibitionArt,
      Exhibition,
    ]), 
    FilesModule,
    TranslationModule,
    LocationModule
  ],
})
export class ArtsModule { }
