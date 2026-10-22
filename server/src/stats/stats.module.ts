import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorView } from 'src/authors/author-view.model';
import { AuthorFollow } from '../authors/author-follow.model';
import { Country } from '../location/models/country.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AuthorView,
      ArtLike,
      ArtView,
      AuthorProfile,
      Art,
      User,
      AuthorFollow,
      Country,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
