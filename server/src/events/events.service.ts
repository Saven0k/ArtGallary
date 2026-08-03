// src/events/events.service.ts
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilesService } from '../files/files.service';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event) private eventModel: typeof Event,
        private fileService: FilesService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) {}

    async create(dto: CreateEventDto, image: any): Promise<Event> {
        this.log('create', { title: dto.title });

        const imagePath = await this.fileService.createFile(image);

        const event = await this.eventModel.create({
            title: dto.title,
            description: dto.description,
            image: imagePath,
        });

        this.log('create', { success: true, eventId: event.id });
        return event;
    }

    async update(id: number, dto: UpdateEventDto, image?: any): Promise<Event> {
        this.log('update', { eventId: id });

        const event = await this.eventModel.findByPk(id);
        if (!event) {
            throw new HttpException('Событие не найдено', HttpStatus.NOT_FOUND);
        }

        const updateData: any = {};
        if (dto.title) updateData.title = dto.title;
        if (dto.description) updateData.description = dto.description;

        if (image) {
            if (event.image) {
                await this.fileService.removeFile(event.image);
            }
            updateData.image = await this.fileService.createFile(image);
        }

        await event.update(updateData);

        this.log('update', { success: true, eventId: id });
        return event;
    }

    async delete(id: number): Promise<{ success: boolean; message: string }> {
        this.log('delete', { eventId: id });

        const event = await this.eventModel.findByPk(id);
        if (!event) {
            throw new HttpException('Событие не найдено', HttpStatus.NOT_FOUND);
        }

        if (event.image) {
            await this.fileService.removeFile(event.image);
        }

        await event.destroy();

        this.log('delete', { success: true, eventId: id });
        return {
            success: true,
            message: 'Событие успешно удалено',
        };
    }

    async getById(id: number): Promise<Event> {
        const event = await this.eventModel.findByPk(id);
        if (!event) {
            throw new HttpException('Событие не найдено', HttpStatus.NOT_FOUND);
        }
        return event;
    }

    async getAll(page: number = 1, limit: number = 10): Promise<{
        data: Event[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }> {
        this.log('getAll', { page, limit });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.eventModel.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                hasNextPage: page < Math.ceil(count / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    async getLatest(limit: number = 4): Promise<Event[]> {
        this.log('getLatest', { limit });

        return this.eventModel.findAll({
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    private log(method: string, data: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'EventsService',
            ...data,
        }));
    }
}