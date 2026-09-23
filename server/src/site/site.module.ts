import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SiteVisit } from './models/site-visit.model';
import { SiteRating } from './models/site-rating.model';
import { SiteVisitService } from './site-visit.service';
import { SiteRatingService } from './site-rating.service';
import { SiteController } from './site.controller';
import { User } from '../users/users.model';

@Module({
    controllers: [SiteController],
    providers: [SiteVisitService, SiteRatingService],
    imports: [SequelizeModule.forFeature([SiteVisit, SiteRating, User])],
    exports: [SiteVisitService, SiteRatingService],
})
export class SiteModule {}