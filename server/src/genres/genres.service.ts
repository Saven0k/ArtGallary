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
        this.logger.log('info', '🌱 Начало заполнения жанров...');

        try {
            for (const item of initialGenresData) {
                const artType = await ArtType.findOne({
                    where: { name: item.artType }
                });

                if (!artType) {
                    this.logger.warn(`⚠️ Вид искусства "${item.artType}" не найден, пропускаем жанр "${item.title}"`);
                    continue;
                }

                await this.genreRepository.findOrCreate({
                    where: { title: item.title, art_type_id: artType.id },
                    defaults: {
                        title: item.title,
                        art_type_id: artType.id
                    }
                });
                this.logger.log('debug', `✅ Создан жанр: ${item.title} (${item.artType})`);
            }

            this.logger.log('info', '✅ Жанры успешно заполнены!');
        } catch (error) {
            this.logger.error('❌ Ошибка при заполнении жанров:', String(error));
            throw error;
        }
    }

    async create(dto: CreateGenreDto) {
        this.logger.log('info', JSON.stringify({
            message: '🎵 Создание нового жанра',
            context: 'GenresService.create',
            genreName: dto.title
        }));

        const genre = await this.genreRepository.create(dto);

        this.logger.log('info', JSON.stringify({
            message: '✅ Жанр успешно создан',
            context: 'GenresService.create',
            genreId: genre.id,
            genreName: genre.title
        }));

        return genre;
    }

    async update(id: number, dto: UpdateGenreDto) {
        this.logger.log('info', JSON.stringify({
            message: '✏️ Обновление жанра',
            context: 'GenresService.update',
            genreId: id,
            updateData: dto
        }));

        if (!id) {
            throw new HttpException("Id required to update genre", 400);
        }

        try {
            const updateData: any = {};
            if (dto.title !== undefined) updateData.title = dto.title;
            if (dto.art_type_id !== undefined) updateData.art_type_id = dto.art_type_id;

            const [affectedCount] = await this.genreRepository.update(updateData, {
                where: { id }
            });

            if (affectedCount === 0) {
                throw new HttpException("Genre not found", 404);
            }

            const updatedGenre = await this.genreRepository.findByPk(id);

            this.logger.log('info', JSON.stringify({
                message: '✅ Жанр успешно обновлен',
                context: 'GenresService.update',
                genreId: id
            }));

            return updatedGenre;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при обновлении жанра',
                context: 'GenresService.update',
                genreId: id,
                error: e.message
            }));
            throw new HttpException(`Genre update not success: ${e.message}`, 400);
        }
    }

    async delete(id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Попытка удаления жанра',
            context: 'GenresService.delete',
            genreId: id
        }));

        if (!id) {
            throw new HttpException("Id required to delete genre", 400);
        }

        try {
            await this.genreRepository.destroy({ where: { id } });

            this.logger.log('info', JSON.stringify({
                message: '✅ Жанр успешно удален',
                context: 'GenresService.delete',
                genreId: id
            }));

            return { success: true };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении жанра',
                context: 'GenresService.delete',
                genreId: id,
                error: e.message
            }));
            throw new HttpException("Genre delete not success", 400);
        }
    }

    async deleteAll() {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Попытка удаления всех жанров',
            context: 'GenresService.deleteAll'
        }));

        try {
            await this.genreRepository.destroy({ where: {} });

            this.logger.log('info', JSON.stringify({
                message: '✅ Все жанры успешно удалены',
                context: 'GenresService.deleteAll'
            }));

            return { success: true };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении всех жанров',
                context: 'GenresService.deleteAll',
                error: e.message
            }));
            throw new HttpException("Genres delete not success", 400);
        }
    }

    async getAll(lang: string = 'ru', artTypeId?: number) {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка всех жанров',
            context: 'GenresService.getAll',
            lang,
            artTypeId
        }));

        const where: any = {};
        if (artTypeId) {
            where.art_type_id = artTypeId;
        }

        let genres = await this.genreRepository.findAll({
            where,
            include: [{ model: ArtType }]
        });

        if (lang && lang !== 'ru') {
            genres = await this.translationService.translateEntities(
                genres,
                'genre',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Список жанров получен',
            context: 'GenresService.getAll',
            count: genres.length,
            lang
        }));

        return genres;
    }

    async getById(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Поиск жанра по ID',
            context: 'GenresService.getById',
            genreId: id,
            lang
        }));

        try {
            let genre = await this.genreRepository.findByPk(id, {
                include: [{ model: ArtType }]
            });

            if (!genre) {
                throw new HttpException("Genre not found", 404);
            }

            if (lang && lang !== 'ru') {
                genre = await this.translationService.translateEntity(
                    genre,
                    'genre',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Жанр найден',
                context: 'GenresService.getById',
                genreId: id,
                genreName: genre.title,
                lang
            }));

            return genre;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при поиске жанра',
                context: 'GenresService.getById',
                genreId: id,
                error: e.message
            }));
            throw new HttpException("Genre not found", 404);
        }
    }

    async getGenresByArtType(artTypeId: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос жанров по виду искусства',
            context: 'GenresService.getGenresByArtType',
            artTypeId,
            lang
        }));

        let genres = await this.genreRepository.findAll({
            where: { art_type_id: artTypeId },
            include: [{ model: ArtType }]
        });

        if (lang && lang !== 'ru') {
            genres = await this.translationService.translateEntities(
                genres,
                'genre',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Жанры по виду искусства получены',
            context: 'GenresService.getGenresByArtType',
            artTypeId,
            count: genres.length,
            lang
        }));

        return genres;
    }
}