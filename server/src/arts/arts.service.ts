// src/arts/arts.service.ts
//
// Ключевые изменения vs старая версия:
//   - country_id / city_id теперь INTEGER FK → используем BelongsTo JOIN
//   - enrichWithLocation / enrichWithLocationBatch УДАЛЕНЫ — данные приходят через include
//   - locationService.getCountryByCode больше не вызывается для каждой картины
//   - валидация при создании/обновлении — через locationService.getCountryById / getCityById

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Art } from './arts.model';
import { CreateArtDto } from './dto/create-art.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FilesService } from '../files/files.service';
import { UpdateArtDTO } from './dto/update-art.dto';
import { User } from '../users/users.model';
import { ArtistProfile } from '../artists/artist.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { ModerateArtDto } from './dto/moderate-art.dto';
import { Sequelize, Op } from 'sequelize';
import { ArtView } from './art-view.model';
import { LocationService } from '../location/location.service';
import { TagsService } from 'src/tags/tags.service';
import { Tag } from 'src/tags/tag.model';
import { Country } from '../location/models/country.model';
import { City } from '../location/models/city.model';
type Lang = 'ru' | 'en';

@Injectable()
export class ArtsService {
    constructor(
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectModel(ArtView) private artViewRepository: typeof ArtView,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        private fileService: FilesService,
        @InjectConnection() private sequelize: Sequelize,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private locationService: LocationService,
        private tagsService: TagsService,
    ) { }
    private readonly PLAN_WEIGHT = { free: 0, pro: 50, vip: 100 };
    private readonly FRESHNESS_DAYS = 30;
    private readonly FEATURED_BONUS = 200;
    private readonly FEATURED_DAYS = 7;

    // ────────────────────────────────────────────────────────────────────────
    // CREATE
    // ────────────────────────────────────────────────────────────────────────
    async createArt(dto: CreateArtDto, imagePath: any, artistId: number) {
        // ✅ Валидация: country_id — числовой ID из нашей таблицы
        if (dto.country_id) {
            const country = await this.locationService.getCountryById(dto.country_id);
            if (!country) {
                throw new HttpException('Страна не найдена', HttpStatus.BAD_REQUEST);
            }
        }

        // ✅ Валидация: city_id — числовой ID из нашей таблицы
        if (dto.city_id) {
            const city = await this.locationService.getCityById(dto.city_id);
            if (!city) {
                throw new HttpException('Город не найден', HttpStatus.BAD_REQUEST);
            }
        }

        const transaction = await this.sequelize.transaction();
        try {
            const fileName = await this.fileService.createFile(imagePath);

            const art = await this.artRepository.create({
                ...this.buildArtData(dto, artistId),
                image_path: fileName,
                score: 0,
                moderate: JSON.stringify({
                    moderate: false,
                    moderator_id: null,
                    errors: {},
                    moderated_at: null,
                    comment: null,
                }),
            }, { transaction });

            if (dto.tags && dto.tags.length > 0) {
                const tags = await this.tagsService.findOrCreateTags(dto.tags);
                await art.$set('tags', tags);
            }

            await this.updateScore(art.id);
            await transaction.commit();

            // Возвращаем с join-данными локации
            return this.findArtWithLocation(art.id);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('createArt', e, `Error creating art: ${e.message}`);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // READ — локация через JOIN, никаких доп. запросов
    // ────────────────────────────────────────────────────────────────────────

    async getArtById(id: number, lang: string = 'ru') {
        const art = await this.artRepository.findByPk(id, {
            include: [
                ...this.getDefaultIncludes(),
                // ✅ Локация через JOIN — один запрос, данные уже внутри
                {
                    model: Country,
                    as: 'country',
                    attributes: [
                        'id', 'iso2', 'iso3',
                        lang === 'ru' ? 'name_ru' : 'name_en',
                    ],
                    required: false,
                },
                {
                    model: City,
                    as: 'city',
                    attributes: [
                        'id', 'country_code',
                        lang === 'ru' ? 'name_ru' : 'name_en',
                    ],
                    required: false,
                },
            ],
        });

        if (!art) return null;

        return this.formatArtWithLocation(art.toJSON(), lang);
    }

    async getAllArts(page: number = 1, limit: number = 12, lang: Lang = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, 'all');
    }

    async getUnmoderatedArts(page: number = 1, limit: number = 12, lang: Lang = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, 'unmoderated');
    }

    async getModeratedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        const offset = (page - 1) * limit;

        const { count, rows } = await this.artRepository.findAndCountAll({
            where: { moderate: { [Op.ne]: null } },
            include: this.getDefaultIncludesWithLocation(lang),
            order: [['score', 'DESC'], ['likes', 'DESC'], ['views', 'DESC'], ['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true,
        });

        const filteredArts = rows
            .filter(art => {
                try { return JSON.parse(art.moderate)?.moderate === true; }
                catch { return false; }
            })
            .map(art => this.formatArtWithLocation(art.toJSON(), lang));

        return {
            arts: filteredArts,
            pagination: this.buildPagination(count, page, limit),
        };
    }

    async getTopArts(limit: number = 10, lang: string = 'ru') {
        const arts = await this.artRepository.findAll({
            where: { moderate: { [Op.ne]: null } },
            include: this.getDefaultIncludesWithLocation(lang),
            order: [['is_featured', 'DESC'], ['score', 'DESC'], ['likes', 'DESC']],
            limit: limit * 3,
        });

        const now = new Date();
        const validArts = arts.filter(
            art => !art.featured_until || new Date(art.featured_until) > now
        );

        return this.getWeightedRandomSelection(validArts, limit)
            .map(art => this.formatArtWithLocation(
                art.toJSON ? art.toJSON() : art,
                lang,
            ));
    }

    // ────────────────────────────────────────────────────────────────────────
    // UPDATE / DELETE
    // ────────────────────────────────────────────────────────────────────────

    async updateArt(id: number, dto: UpdateArtDTO) {
        const art = await this.artRepository.findByPk(id, {
            include: [{ model: Tag, as: 'tags' }],
        });
        if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

        try {
            const { tags, ...updateData } = dto;
            if (Object.keys(updateData).length > 0) {
                await this.artRepository.update(updateData, { where: { id } });
            }
            if (tags !== undefined) await this.tagsService.updateTagsForArt(art, tags);
            await this.updateScore(id);

            return this.findArtWithLocation(id);
        } catch (e: any) {
            this.handleError('updateArt', e, `Art update not success: ${e.message}`);
        }
    }

    async deleteArt(id: number) {
        const art = await this.artRepository.findByPk(id);
        if (!art) throw new HttpException('Art not found', HttpStatus.BAD_REQUEST);
        await art.destroy();
        return { success: true };
    }

    async moderateArt(moderateDto: ModerateArtDto, id: number) {
        const transaction = await this.sequelize.transaction();
        try {
            const art = await this.artRepository.findByPk(id);
            if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

            await this.artRepository.update(
                {
                    moderate: JSON.stringify({
                        moderate: moderateDto.moderate,
                        moderator_id: moderateDto.moderator_id,
                        errors: moderateDto.errors || {},
                        moderated_at: new Date(),
                        comment: moderateDto.comment || null,
                        previous_moderate: this.parseModerate(art.moderate),
                    }),
                },
                { where: { id }, transaction },
            );

            await transaction.commit();
            await this.updateScore(id);
            return this.findArtWithLocation(id);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('moderateArt', e, `Art moderate not success: ${e.message}`);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // VIEWS / FEATURED / SCORES
    // ────────────────────────────────────────────────────────────────────────

    async incrementView(artId: number, userId?: number): Promise<Art> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) throw new HttpException('Произведение не найдено', HttpStatus.NOT_FOUND);

        if (!userId) {
            await art.increment('views', { by: 1 });
        } else if (!await this.hasUserViewedToday(artId, userId)) {
            await art.increment('views', { by: 1 });
            await this.recordView(artId, userId);
        }

        await art.reload();
        await this.updateScore(artId);
        return art;
    }

    async addToFeatured(artId: number, days: number = this.FEATURED_DAYS): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + days);
        await art.update({ is_featured: true, featured_until: featuredUntil });
        await this.updateScore(artId);
    }

    async removeFromFeatured(artId: number): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;
        await art.update({ is_featured: false, featured_until: null });
        await this.updateScore(artId);
    }

    async refreshFeaturedArts(): Promise<void> {
        await this.artRepository.update(
            { is_featured: false, featured_until: null },
            { where: { is_featured: true, featured_until: { [Op.lt]: new Date() } } },
        );

        const candidates = await this.artRepository.findAll({
            where: { is_featured: false, moderate: { [Op.ne]: null } },
            order: [['score', 'DESC'], ['likes', 'DESC']],
            limit: 10,
        });

        for (const art of candidates) await this.addToFeatured(art.id, this.FEATURED_DAYS);
        this.logger.log('info', `🔄 Обновлен топ: ${candidates.length} картин`);
    }

    async updateAllScores(): Promise<void> {
        const arts = await this.artRepository.findAll();
        for (const art of arts) {
            const score = await this.calculateScore(art);
            await art.update({ score });
        }
        this.logger.log('info', `✅ Обновлены скоры для ${arts.length} картин`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Найти арт с локацией через JOIN (без доп. запросов к location service).
     */
    private async findArtWithLocation(id: number, lang: string = 'ru') {
        const art = await this.artRepository.findByPk(id, {
            include: [
                ...this.getDefaultIncludes(),
                ...this.getLocationIncludes(lang),
            ],
        });
        return art ? this.formatArtWithLocation(art.toJSON(), lang) : null;
    }

    /**
     * Includes для страны и города (JOIN).
     */
    private getLocationIncludes(lang: string = 'ru') {
        const nameField = lang === 'ru' ? 'name_ru' : 'name_en';
        return [
            {
                model: Country,
                as: 'country',
                attributes: ['id', 'iso2', 'iso3', nameField],
                required: false,
            },
            {
                model: City,
                as: 'city',
                attributes: ['id', 'country_code', nameField],
                required: false,
            },
        ];
    }

    /**
     * Все includes с локацией — для списков.
     */
    private getDefaultIncludesWithLocation(lang: string = 'ru') {
        return [
            ...this.getDefaultIncludes(),
            ...this.getLocationIncludes(lang),
        ];
    }

    private getDefaultIncludes() {
        return [
            {
                model: ArtistProfile,
                required: false,
                attributes: ['user_id'],
                include: [{ model: User, attributes: ['id', 'name', 'surname', 'avatar_path'] }],
            },
            { model: Genre, required: false, attributes: ['id', 'title'] },
            { model: Style, required: false, attributes: ['id', 'name'] },
            { model: Tag, as: 'tags', attributes: ['id', 'name'] },
        ];
    }

    /**
     * Форматирует объект арта: парсит moderate JSON,
     * нормализует поля country/city для фронта.
     */
    private formatArtWithLocation(art: any, lang: string = 'ru') {
        const nameField = lang === 'ru' ? 'name_ru' : 'name_en';

        // Парсим moderate
        if (art.moderate && typeof art.moderate === 'string') {
            try { art.moderate = JSON.parse(art.moderate); }
            catch { art.moderate = null; }
        }

        // ✅ Нормализуем country: { id, iso2, name }
        if (art.country) {
            art.country = {
                id: art.country.id,
                iso2: art.country.iso2,
                iso3: art.country.iso3,
                name: art.country[nameField] || art.country.name_en || art.country.name_ru,
            };
        }

        // ✅ Нормализуем city: { id, country_code, name }
        if (art.city) {
            art.city = {
                id: art.city.id,
                country_code: art.city.country_code,
                name: art.city[nameField] || art.city.name_en || art.city.name_ru,
            };
        }

        return art;
    }

    private buildArtData(dto: CreateArtDto, artistId: number) {
        return {
            title: dto.title,
            description: dto.description,
            cost: dto.cost || null,
            currency: dto.currency || null,
            likes: dto.likes || 0,
            date_published: dto.date_published,
            artist_id: artistId,
            city_id: dto.city_id || null,
            country_id: dto.country_id || null,
            genre_id: dto.genre_id || null,
            style_id: dto.style_id || null,
            specifications: dto.specifications || null,
            is_adult: dto.is_adult || false,
            tags: dto.tags || null,
        };
    }

    private parseModerate(moderate: string) {
        if (!moderate) return {};
        try { return JSON.parse(moderate); }
        catch { return {}; }
    }

    private async hasUserViewedToday(artId: number, userId: number): Promise<boolean> {
        const view = await this.artViewRepository.findOne({
            where: {
                art_id: artId,
                user_id: userId,
                viewed_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        });
        return !!view;
    }

    private async recordView(artId: number, userId: number): Promise<void> {
        await this.artViewRepository.create({ art_id: artId, user_id: userId, viewed_at: new Date() });
    }

    private async calculateScore(art: Art): Promise<number> {
        const artist = await this.artistProfileModel.findOne({ where: { user_id: art.artist_id } });
        const planWeight = artist?.plan ? this.PLAN_WEIGHT[artist.plan as keyof typeof this.PLAN_WEIGHT] || 0 : 0;
        const ageInDays = this.getAgeInDays(art.date_published);
        const freshnessWeight = Math.max(this.FRESHNESS_DAYS - ageInDays, 0);
        const featuredBonus = art.is_featured ? this.FEATURED_BONUS : 0;
        return Math.round(((art.likes || 0) * 5 + (art.views || 0) * 0.1 + planWeight + freshnessWeight + featuredBonus) * 100) / 100;
    }

    private async updateScore(artId: number): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;
        await art.update({ score: await this.calculateScore(art) });
    }

    private getWeightedRandomSelection(arts: any[], limit: number): any[] {
        if (arts.length <= limit) return arts;
        const seed = new Date().toDateString();
        return this.shuffleArray(arts, seed).sort((a, b) => b.score - a.score).slice(0, limit);
    }

    private shuffleArray(array: any[], seed: string): any[] {
        const shuffled = [...array];
        const random = this.seededRandom(seed);
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private seededRandom(seed: string): () => number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return () => {
            hash = (hash * 9301 + 49297) % 233280;
            return hash / 233280;
        };
    }

    private buildPagination(total: number, page: number, limit: number) {
        const totalPages = Math.ceil(total / limit);
        return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
    }

    private getAgeInDays(date: Date): number {
        return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
    }

    private handleError(method: string, error: any, message: string): never {
        this.logger.error(`❌ ${method} failed:`, error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    private async getArtsWithFilters(page: number, limit: number, lang: Lang, type: 'all' | 'moderated' | 'unmoderated') {
        const offset = (page - 1) * limit;

        const where: any = {};

        if (type === 'moderated') {
            where.moderate = { [Op.ne]: null };
        } else if (type === 'unmoderated') {
            where.moderate = null;
        }

        const { count, rows } = await this.artRepository.findAndCountAll({
            where,
            include: this.getDefaultIncludes(),
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true,
            raw: true,
            nest: true,
        });

        const formattedArts = await this.enrichWithLocationBatch(rows, lang);

        return {
            arts: formattedArts,
            pagination: this.buildPagination(count, page, limit)
        };
    }
    private async enrichWithLocationBatch(arts: any[], lang: Lang) {
        const countryIds = [...new Set(arts.map(a => a.country_id).filter(Boolean))];
        const countriesMap = new Map();
        const citiesMap = new Map();

        if (countryIds.length) {
            for (const id of countryIds) {
                const country = await this.locationService.getCountryByCode(String(id), lang);
                if (country) {
                    countriesMap.set(id, {
                        id: country.id,
                        name: country.name,
                        iso2: country.iso2
                    });
                }

                const cities = await this.locationService.getCitiesByCountryCode(String(id), lang);
                cities.forEach(city => {
                    citiesMap.set(city.id, {
                        id: city.id,
                        name: city.name,
                        country_id: city.country_code
                    });
                });
            }
        }

        return arts.map(art => ({
            ...art,
            city: art.city_id ? citiesMap.get(Number(art.city_id)) || null : null,
            country: art.country_id ? countriesMap.get(Number(art.country_id)) || null : null
        }));
    }
}