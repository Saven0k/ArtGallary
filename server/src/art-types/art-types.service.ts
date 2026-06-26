import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArtType } from './art-type.model';
import { CreateArtTypeDto, UpdateArtTypeDto } from './dto/create-art-type.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { TranslationService } from 'src/translation/translation.service';
import { initialArtTypesData } from './art-types.data';

@Injectable()
export class ArtTypesService {
    constructor(
        @InjectModel(ArtType) private artTypeRepository: typeof ArtType,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService
    ) {}

    async seedArtTypes() {
        this.logger.log('info', '🌱 Начало заполнения видов искусства...');

        try {
            for (const name of initialArtTypesData) {
                await this.artTypeRepository.findOrCreate({
                    where: { name },
                    defaults: { name }
                });
                this.logger.log('debug', `✅ Создан вид искусства: ${name}`);
            }

            this.logger.log('info', '✅ Виды искусства успешно заполнены!');
        } catch (error) {
            this.logger.error('❌ Ошибка при заполнении видов искусства:', String(error));
            throw error;
        }
    }

    async create(dto: CreateArtTypeDto) {
        this.logger.log('info', JSON.stringify({
            message: '🎨 Создание нового вида искусства',
            context: 'ArtTypesService.create',
            name: dto.name
        }));

        const artType = await this.artTypeRepository.create(dto);

        this.logger.log('info', JSON.stringify({
            message: '✅ Вид искусства успешно создан',
            context: 'ArtTypesService.create',
            id: artType.id,
            name: artType.name
        }));

        return artType;
    }

    async update(id: number, dto: UpdateArtTypeDto) {
        this.logger.log('info', JSON.stringify({
            message: '✏️ Обновление вида искусства',
            context: 'ArtTypesService.update',
            id: id,
            updateData: dto
        }));

        const [affectedCount] = await this.artTypeRepository.update(dto, {
            where: { id }
        });

        if (affectedCount === 0) {
            throw new HttpException('Вид искусства не найден', 404);
        }

        const updatedArtType = await this.artTypeRepository.findByPk(id);

        this.logger.log('info', JSON.stringify({
            message: '✅ Вид искусства успешно обновлен',
            context: 'ArtTypesService.update',
            id: id
        }));

        return updatedArtType;
    }

    async delete(id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Попытка удаления вида искусства',
            context: 'ArtTypesService.delete',
            id: id
        }));

        const artType = await this.artTypeRepository.findByPk(id);
        if (!artType) {
            throw new HttpException('Вид искусства не найден', 404);
        }

        await artType.destroy();

        this.logger.log('info', JSON.stringify({
            message: '✅ Вид искусства успешно удален',
            context: 'ArtTypesService.delete',
            id: id
        }));

        return { success: true };
    }

    async getAll(lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка всех видов искусства',
            context: 'ArtTypesService.getAll',
            lang
        }));

        let artTypes = await this.artTypeRepository.findAll();

        if (lang && lang !== 'ru') {
            artTypes = await this.translationService.translateEntities(
                artTypes,
                'artType',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Список видов искусства получен',
            context: 'ArtTypesService.getAll',
            count: artTypes.length,
            lang
        }));

        return artTypes;
    }

    async getById(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Поиск вида искусства по ID',
            context: 'ArtTypesService.getById',
            id: id,
            lang
        }));

        let artType = await this.artTypeRepository.findByPk(id);

        if (!artType) {
            throw new HttpException('Вид искусства не найден', 404);
        }

        if (lang && lang !== 'ru') {
            artType = await this.translationService.translateEntity(
                artType,
                'artType',
                id,
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Вид искусства найден',
            context: 'ArtTypesService.getById',
            id: id,
            name: artType.name,
            lang
        }));

        return artType;
    }
}