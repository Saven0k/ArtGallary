import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Style } from './styles.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Genre } from '../genres/genre.model';
import { CreateStyleDto } from './dto/create-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';

@Injectable()
export class StylesService {
    constructor(
        @InjectModel(Style) private stylesRepository: typeof Style,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }

    async create(dto: CreateStyleDto) {
        this.log('create', { name: dto.name });
        const style = await this.stylesRepository.create(dto);
        this.log('created', { id: style.id, name: style.name });
        return style;
    }

    async update(id: number, dto: UpdateStyleDto) {
        this.log('update', { id });
        const updateData = this.pick(dto, ['name', 'description']);
        const [affectedCount] = await this.stylesRepository.update(updateData, { where: { id } });
        if (!affectedCount) throw new HttpException('Style not found', 404);
        const updated = await this.stylesRepository.findByPk(id);
        this.log('updated', { id });
        return updated;
    }

    async delete(id: number) {
        this.log('delete', { id });
        const style = await this.stylesRepository.findByPk(id);
        if (!style) throw new HttpException('Style not found', 404);
        const deletedCount = await this.stylesRepository.destroy({ where: { id } });
        if (!deletedCount) throw new HttpException('Style not found', 404);
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
        const style = await this.stylesRepository.findByPk(id, {       include: [{ model: Genre }] });
        if (!style)  throw new HttpException('Style not found', 404);
        return style;
    }

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null)  acc[key] = obj[key];
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
}