import { HttpException, Injectable } from '@nestjs/common';
import { CreateStyleDto, UpdateStyleDto } from './dto/create-style.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Style } from './styles.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Genre } from '../genres/genre.model';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class StylesSerivce {
    constructor(
        @InjectModel(Style) private stylesRepository: typeof Style,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService
    ) { }

    async create(dto: CreateStyleDto) {
        this.logger.log('info', JSON.stringify({
            message: '🏷️ Создание нового стиля',
            context: 'StylesSerivce.create',
            typeName: dto.name
        }));

        const style = await this.stylesRepository.create(dto);

        this.logger.log('info', JSON.stringify({
            message: '✅ Стиль успешно создан',
            context: 'StylesSerivce.create',
            typeId: style.id,
            typeName: style.name
        }));

        return style;
    }

    async update(id: number, dto: UpdateStyleDto) {
        this.logger.log('info', JSON.stringify({
            message: '✏️ Обновление стиля',
            context: 'StylesSerivce.update',
            typeId: id,
            updateData: dto
        }));

        if (!id) {
            throw new HttpException("Id required to update style", 400);
        }

        try {
            const updateData: any = {};
            if (dto.name !== undefined) updateData.name = dto.name;

            const [affectedCount] = await this.stylesRepository.update(updateData, {
                where: { id }
            });

            if (affectedCount === 0) {
                throw new HttpException("style not found", 404);
            }

            const updatedType = await this.stylesRepository.findByPk(id);

            this.logger.log('info', JSON.stringify({
                message: '✅ Стиль успешно обновлен',
                context: 'StylesSerivce.update',
                typeId: id
            }));

            return updatedType;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при обновлении стиля',
                context: 'StylesSerivce.update',
                typeId: id,
                error: e.message
            }));
            throw new HttpException(`style update not success: ${e.message}`, 400);
        }
    }

    async delete(id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Попытка удаления стиля',
            context: 'StylesSerivce.delete',
            typeId: id
        }));

        if (!id) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ ID не предоставлен для удаления стиля',
                context: 'StylesSerivce.delete'
            }));
            throw new HttpException("Id required to delete style", 400);
        }
        const transaction = await this.stylesRepository.sequelize?.transaction();
        try {
            const style = await this.stylesRepository.findByPk(id);
            if (!style) {
                throw new HttpException("style not found", 404);
            }
            const deletedCount = await this.stylesRepository.destroy({
                where: { id },
                transaction
            });
            if (deletedCount === 0) {
                throw new HttpException("style not found", 404);
            }
            if (transaction) await transaction.commit();
            this.logger.log('info', JSON.stringify({
                message: '✅ Стиль успешно удален',
                context: 'StylesSerivce.delete',
                typeId: id
            }));
            return { success: true, message: 'Стиль удален' };
        } catch (e: any) {
            if (transaction) await transaction.rollback();

            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении стиля',
                context: 'StylesSerivce.delete',
                typeId: id,
                error: e.message
            }));
            throw new HttpException(`style delete not success: ${e.message}`, 400);
        }
    }

    async getAll(lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка всех стилей',
            context: 'StylesSerivce.getAll',
            lang
        }));

        let types = await this.stylesRepository.findAll();

        if (lang && lang !== 'ru') {
            types = await this.translationService.translateEntities(
                types,
                'style',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Список стилей получен',
            context: 'StylesSerivce.getAll',
            count: types.length,
            lang
        }));

        return types;
    }

    async getById(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Поиск стиля по ID',
            context: 'StylesSerivce.getById',
            typeId: id,
            lang
        }));

        if (!id) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ ID не предоставлен для поиска стиля',
                context: 'StylesSerivce.getById'
            }));
            throw new HttpException("Id required to get style", 400);
        }

        try {
            let style = await this.stylesRepository.findByPk(id, { include: Genre });

            if (!style) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Стиль не найден',
                    context: 'StylesSerivce.getById',
                    typeId: id
                }));
                throw new HttpException("style not found", 404);
            }

            if (lang && lang !== 'ru') {
                style = await this.translationService.translateEntity(
                    style,
                    'style',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Стиль найден',
                context: 'StylesSerivce.getById',
                typeId: id,
                typeName: style.name,
                lang
            }));

            return style;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при поиске стиля',
                context: 'StylesSerivce.getById',
                typeId: id,
            }));
            throw new HttpException("style not found", 404);
        }
    }
}