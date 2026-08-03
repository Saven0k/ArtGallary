// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.model';
import { FilesService } from '../files/files.service';

@Module({
    imports: [SequelizeModule.forFeature([Event])],
    controllers: [EventsController],
    providers: [EventsService, FilesService],
    exports: [EventsService],
})
export class EventsModule {}