import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthorProfile } from './author.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { FilesModule } from '../files/files.module';
import { PasswordModule } from '../password/password.module';
import { LocationModule } from 'src/location/location.module';
import { Profession } from 'src/professions/profession.model';
import { Subscription } from 'src/subscriptions/subscription.model';
import { SubscriptionModule } from 'src/subscriptions/subscriptions.module';
import { AuthorFollowService } from './author-follow.service';
import { AuthorFollow } from './author-follow.model';
import { NotificationModule } from 'src/notifications/notifications.module';
import { AuthorLike } from './author-like.model';
import { AuthorView } from './author-view.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Art,
      User,
      AuthorProfile,
      AuthorLike,
      AuthorView,
      Genre,
      Profession,
      Subscription,
      AuthorFollow
    ]), FilesModule, PasswordModule, LocationModule,SubscriptionModule, NotificationModule
  ],
  controllers: [AuthorsController],
  providers: [AuthorFollowService, AuthorsService],
  exports: [AuthorFollowService]
})
export class AuthorsModule { }
