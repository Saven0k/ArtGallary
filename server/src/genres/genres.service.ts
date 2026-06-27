import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Genre } from './genre.model';
import { CreateGenreDto, UpdateGenreDto } from './dto/create-genre.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { TranslationService } from 'src/translation/translation.service';
import { ArtType } from '../art-types/art-type.model';
import { initialGenresData } from './genres.data';

@Injectable()
export class GenresService {
    constructor(
        @InjectModel(Genre) private genreRepository: typeof Genre,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService
    ) {}

    async seedGenres() {
        this.log('🌱 Начало заполнения жанров...');

        try {
            const artTypes = await ArtType.findAll();
            const artTypeMap = new Map(artTypes.map(at => [at.name, at.id]));

            for (const item of initialGenresData) {
                const artTypeId = artTypeMap.get(item.artType);
                if (!artTypeId) {
                    this.logger.warn(`⚠️ Вид искусства "${item.artType}" не найден, пропускаем жанр "${item.title}"`);
                    continue;
                }

                await this.genreRepository.findOrCreate({
                    where: { title: item.title, art_type_id: artTypeId },
                    defaults: { title: item.title, art_type_id: artTypeId }
                });
                this.logger.debug(`✅ Создан жанр: ${item.title} (${item.artType})`);
            }

            this.log('✅ Жанры успешно заполнены!');
        } catch (error) {
            this.logger.error('❌ Ошибка при заполнении жанров:', String(error));
            throw error;
        }
    }


    async create(dto: CreateGenreDto) {
        this.log('create', { genreName: dto.title });
        const genre = await this.genreRepository.create(dto);
        this.log('created', { genreId: genre.id, genreName: genre.title });
        return genre;
    }

    async update(id: number, dto: UpdateGenreDto) {
        this.log('update', { genreId: id });

        const [affectedCount] = await this.genreRepository.update(
            this.pick(dto, ['title', 'art_type_id']),
            { where: { id } }
        );

        if (!affectedCount) {
            throw new HttpException('Genre not found', 404);
        }

        const updated = await this.genreRepository.findByPk(id);
        this.log('updated', { genreId: id });
        return updated;
    }

    async delete(id: number) {
        this.log('delete', { genreId: id });

        const result = await this.genreRepository.destroy({ where: { id } });
        if (!result) {
            throw new HttpException('Genre not found', 404);
        }

        this.log('deleted', { genreId: id });
        return { success: true };
    }

    async deleteAll() {
        this.log('deleteAll');
        await this.genreRepository.destroy({ where: {} });
        this.log('deletedAll');
        return { success: true };
    }


    async getAll(lang: string = 'ru', artTypeId?: number) {
        this.log('getAll', { lang, artTypeId });

        const where = artTypeId ? { art_type_id: artTypeId } : {};
        let genres = await this.genreRepository.findAll({
            where,
            include: [{ model: ArtType }]
        });

        return this.translateIfNeeded(genres, 'genre', lang);
    }

    async getById(id: number, lang: string = 'ru') {
        this.log('getById', { genreId: id, lang });

        let genre = await this.genreRepository.findByPk(id, {
            include: [{ model: ArtType }]
        });

        if (!genre) {
            throw new HttpException('Genre not found', 404);
        }

        return this.translateIfNeeded(genre, 'genre', lang);
    }

    async getGenresByArtType(artTypeId: number, lang: string = 'ru') {
        this.log('getGenresByArtType', { artTypeId, lang });

        let genres = await this.genreRepository.findAll({
            where: { art_type_id: artTypeId },
            include: [{ model: ArtType }]
        });

        return this.translateIfNeeded(genres, 'genre', lang);
    }


    private async translateIfNeeded(data: any, type: string, lang: string) {
        if (lang && lang !== 'ru') {
            if (Array.isArray(data)) {
                return this.translationService.translateEntities(data, type, lang);
            }
            return this.translationService.translateEntity(data, type, data.id, lang);
        }
        return data;
    }

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null) {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as Pick<T, K>);
    }

    private log(message: string, data?: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${message}`,
            context: 'GenresService',
            ...data,
        }));
    }
}