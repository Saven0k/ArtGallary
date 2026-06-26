import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Moderator } from './moderator.model';
import { User } from '../users/users.model';
import { ModeratorsController } from './moderators.controller';
import { ModeratorsService } from './moderators.service';
import { FilesService } from '../files/files.service';
import { FilesModule } from '../files/files.module';
import { TranslationModule } from 'src/translation/translation.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Moderator, User]),
        FilesModule,
        TranslationModule
    ],
    controllers: [ModeratorsController],
    providers: [ModeratorsService, FilesService],
    exports: [ModeratorsService]
})
export class ModeratorsModule { }