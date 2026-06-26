import { Module } from '@nestjs/common';
import { ExhibitionsService } from './exhibitions.service';
import { ExhibitionsController } from './exhibitions.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Exhibition } from './exhibition.model';
import { ExhibitionArt } from './exhibition-art.model';
import { ExhibitionArtist } from './exhibition-artist.model';
import { ExhibitionUser } from './exhibition-user.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { ArtistProfile } from '../artists/artist.model';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { TranslationModule } from 'src/translation/translation.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  providers: [ExhibitionsService],
  controllers: [ExhibitionsController],
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      Genre,
      Exhibition,
      ExhibitionArt,
      ExhibitionArtist,
      ExhibitionUser,
      ArtistProfile
    ]),
    FilesModule,
    UsersModule,
    TranslationModule,
    LocationModule
  ]
})
export class ExhibitionsModule { }
