import { Module } from '@nestjs/common';
import { ArtsService } from './arts.service';
import { ArtsController } from './arts.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from './arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { FilesModule } from '../files/files.module';
import { ArtsCron } from './arts.cron';
import { ArtView } from './art-view.model';
import { Style } from 'src/styles/styles.model';
import { LocationModule } from 'src/location/location.module';
import { TagsModule } from 'src/tags/tags.module';
import { Tag } from 'src/tags/tag.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorFollow } from 'src/authors/author-follow.model';
import { NotificationModule } from 'src/notifications/notifications.module';
import { ArtLike } from './art-like.model';

@Module({
  providers: [ArtsService, ArtsCron],
  controllers: [ArtsController],
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      Genre,
      AuthorProfile,
      ArtView,
      ArtLike,
      AuthorFollow,
      Style,
      Tag,
      City,
      Country
    ]), 
    FilesModule,
    LocationModule,
    TagsModule,
    NotificationModule
  ],
})
export class ArtsModule { }
