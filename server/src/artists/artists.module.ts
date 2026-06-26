import { Module } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ArtistProfile } from './artist.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { Exhibition } from '../exhibitions/exhibition.model';
import { ExhibitionArtist } from '../exhibitions/exhibition-artist.model';
import { FilesModule } from '../files/files.module';
import { PasswordModule } from '../password/password.module';
import { TranslationModule } from 'src/translation/translation.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  providers: [ArtistsService],
  controllers: [ArtistsController],
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      ArtistProfile,
      Genre,
      Exhibition,
      ExhibitionArtist
    ]), FilesModule, PasswordModule, TranslationModule,LocationModule
  ]
})
export class ArtistsModule { }
