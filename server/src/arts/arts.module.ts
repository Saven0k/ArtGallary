import { Module } from '@nestjs/common';
import { ArtsService } from './arts.service';
import { ArtsController } from './arts.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from './arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { FilesModule } from '../files/files.module';
import { ArtistProfile } from '../artists/artist.model';
import { ArtsCron } from './arts.cron';
import { ArtView } from './art-view.model';
import { Style } from 'src/styles/styles.model';
import { LocationModule } from 'src/location/location.module';
import { TagsModule } from 'src/tags/tags.module';
import { Tag } from 'src/tags/tag.model';

@Module({
  providers: [ArtsService, ArtsCron],
  controllers: [ArtsController],
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      Genre,
      ArtistProfile,
      ArtView,
      Style,
      Tag
    ]), 
    FilesModule,
    LocationModule,
    TagsModule
  ],
})
export class ArtsModule { }
