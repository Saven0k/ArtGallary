// src/styles/styles.service.ts
import { HttpException, Injectable } from '@nestjs/common';
import { CreateStyleDto, UpdateStyleDto } from './dto/create-style.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Style } from './styles.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Genre } from '../genres/genre.model';

@Injectable()
export class StylesService {
    constructor(
        @InjectModel(Style) private stylesRepository: typeof Style,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) {}

    async create(dto: CreateStyleDto) {
        this.log('create', { name: dto.name });
        const style = await this.stylesRepository.create(dto);
        this.log('created', { id: style.id, name: style.name });
        return style;
    }

    async update(id: number, dto: UpdateStyleDto) {
        this.log('update', { id });

        const updateData = this.pick(dto, ['name']);
        const [affectedCount] = await this.stylesRepository.update(updateData, {
            where: { id }
        });

        if (!affectedCount) {
            throw new HttpException('Style not found', 404);
        }

        const updated = await this.stylesRepository.findByPk(id);
        this.log('updated', { id });
        return updated;
    }

    async delete(id: number) {
        this.log('delete', { id });

        const style = await this.stylesRepository.findByPk(id);
        if (!style) {
            throw new HttpException('Style not found', 404);
        }

        const deletedCount = await this.stylesRepository.destroy({
            where: { id }
        });

        if (!deletedCount) {
            throw new HttpException('Style not found', 404);
        }

        this.log('deleted', { id });
        return { success: true, message: 'Стиль удален' };
    }

    async getAll() {
        this.log('getAll');

        const styles = await this.stylesRepository.findAll();
        return styles;
    }

    async getById(id: number) {
        this.log('getById', { id });

        const style = await this.stylesRepository.findByPk(id, {
            include: [{ model: Genre }]
        });

        if (!style) {
            throw new HttpException('Style not found', 404);
        }

        return style;
    }

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null) {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as Pick<T, K>);
    }

    private log(method: string, data?: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'StylesService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ Ошибка в ${method}`,
            context: 'StylesService',
            error: error.message,
            stack: error.stack,
        }));

        if (error instanceof HttpException) {
            throw error;
        }

        throw new HttpException(
            `Ошибка в ${method}: ${error.message}`,
            400
        );
    }
}