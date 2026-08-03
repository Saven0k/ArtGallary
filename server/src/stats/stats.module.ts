// src/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { AuthorLike } from 'src/authors/author-like.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorView } from 'src/authors/author-view.model';

// src/stats/stats.module.ts
@Module({
    imports: [
        SequelizeModule.forFeature([
            AuthorLike,
            AuthorView,
            ArtLike,
            ArtView,
            AuthorProfile,
            Art,
            User,
        ]),
    ],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule {}