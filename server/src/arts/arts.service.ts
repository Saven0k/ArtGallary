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

    private readonly PLAN_WEIGHT = {
        free: 0,
        pro: 50,
        vip: 100,
    };

    private readonly FRESHNESS_DAYS = 30;
    private readonly FEATURED_BONUS = 200;
    private readonly FEATURED_DAYS = 7;

    async createArt(dto: CreateArtDto, imagePath: any, artistId: number) {
        if (dto.country_id) {
            const country = await this.locationService.getCountryByCode(String(dto.country_id));
            if (!country) {
                throw new HttpException('Страна не найдена', HttpStatus.BAD_REQUEST);
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
                    comment: null
                })
            }, { transaction });

            if (dto.tags && dto.tags.length > 0) {
                const tags = await this.tagsService.findOrCreateTags(dto.tags);
                await art.$set('tags', tags);
            }

            await this.updateScore(art.id);
            await transaction.commit();
            return this.formatArtResponse(art);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('createArt', e, `Error creating art: ${e.message}`);
        }
    }

    async updateArt(id: number, dto: UpdateArtDTO) {
        // Получаем картину с тегами
        const art = await this.artRepository.findByPk(id, { include: [{ model: Tag, as: 'tags' }] });
        if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

        try {
            const { tags, ...updateData } = dto;
            if (Object.keys(updateData).length > 0) {
                const [affectedCount] = await this.artRepository.update(updateData, { where: { id } });
                if (affectedCount === 0) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            }
            if (tags !== undefined) await this.tagsService.updateTagsForArt(art, tags);
            await this.updateScore(id);
            const updatedArt = await this.artRepository.findOne({
                where: { id },
                include: [{ model: Tag, as: 'tags' }]
            });
            return updatedArt;
        } catch (e: any) {
            this.handleError('updateArt', e, `Art update not success: ${e.message}`);
        }
    }

    async deleteArt(id: number) {
        const art = await this.artRepository.findByPk(id);
        if (!art) throw new HttpException('Art not found', HttpStatus.BAD_REQUEST);

        try {
            await art.destroy();
            return { success: true };
        } catch (e: any) {
            this.handleError('deleteArt', e, 'Art delete not success');
        }
    }

    async moderateArt(moderateDto: ModerateArtDto, id: number) {
        const transaction = await this.sequelize.transaction();

        try {
            const art = await this.artRepository.findByPk(id);
            if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

            const currentModerate = this.parseModerate(art.moderate);
            const moderateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null,
                previous_moderate: currentModerate
            };

            const [affectedCount] = await this.artRepository.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { id }, transaction }
            );

            if (affectedCount === 0) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

            await transaction.commit();
            await this.updateScore(id);
            const updatedArt = await this.artRepository.findByPk(id);
            return this.formatArtResponse(updatedArt);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('moderateArt', e, `Art moderate not success: ${e.message}`);
        }
    }

    async getArtById(id: number, lang: string = 'ru') {
        const art = await this.artRepository.findByPk(id, {
            include: [
                { model: ArtistProfile, include: [User] },
                { model: Genre, required: false, attributes: ['id', 'title'] },
                { model: Style, required: false, attributes: ['id', 'name'] },
                { model: Tag, as: 'tags', attributes: ['id', 'name'] }
            ],
            raw: true,
            nest: true
        });

        if (!art) {
            this.logger.warn(`⚠️ Art ${id} not found`);
            return null;
        }

        return this.enrichWithLocation(art, lang);
    }

    async getAllArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, 'all');
    }

    async getUnmoderatedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, 'unmoderated');
    }

    async getModeratedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        const offset = (page - 1) * limit;

        const { count, rows } = await this.artRepository.findAndCountAll({
            where: {
                moderate: { [Op.ne]: null },
            },
            include: this.getDefaultIncludes(),
            order: [
                ['score', 'DESC'],
                ['likes', 'DESC'],
                ['views', 'DESC'],
                ['createdAt', 'DESC'],
            ],
            limit,
            offset,
            distinct: true,
            raw: true,
            nest: true,
        });

        const filteredArts = rows.filter(art => {
            if (!art.moderate) return false;
            try {
                const moderateObj = JSON.parse(art.moderate);
                return moderateObj.moderate === true;
            } catch {
                return false;
            }
        });

        const formattedArts = await this.enrichWithLocationBatch(filteredArts, lang);

        return {
            arts: formattedArts,
            pagination: this.buildPagination(filteredArts.length, page, limit)
        };
    }

    async getTopArts(limit: number = 10, lang: string = 'ru') {
        const arts = await this.artRepository.findAll({
            where: {
                moderate: { [Op.ne]: null },
            },
            include: this.getDefaultIncludes(),
            order: [
                ['is_featured', 'DESC'],
                ['score', 'DESC'],
                ['likes', 'DESC'],
                ['views', 'DESC'],
            ],
            limit: limit * 3,
        });

        const now = new Date();
        const validArts = arts.filter(art =>
            !art.featured_until || new Date(art.featured_until) > now
        );

        const topArts = this.getWeightedRandomSelection(validArts, limit);
        const enriched = await this.enrichWithLocationBatch(topArts, lang);

        return enriched;
    }

    async incrementView(artId: number, userId?: number): Promise<Art> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) throw new HttpException('Произведение не найдено', HttpStatus.NOT_FOUND);

        if (!userId) {
            await art.increment('views', { by: 1 });
            await art.reload();
            await this.updateScore(artId);
            return art;
        }

        const hasViewedToday = await this.hasUserViewedToday(artId, userId);
        if (!hasViewedToday) {
            await art.increment('views', { by: 1 });
            await art.reload();
            await this.recordView(artId, userId);
            await this.updateScore(artId);
        }
        return art;
    }

    private async hasUserViewedToday(artId: number, userId: number): Promise<boolean> {
        const view = await this.artViewRepository.findOne({
            where: {
                art_id: artId,
                user_id: userId,
                viewed_at: {
                    [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });
        return !!view;
    }

    private async recordView(artId: number, userId: number): Promise<void> {
        await this.artViewRepository.create({
            art_id: artId,
            user_id: userId,
            viewed_at: new Date()
        });
    }

    private async calculateScore(art: Art): Promise<number> {
        const artist = await this.artistProfileModel.findOne({
            where: { user_id: art.artist_id },
        });

        const planWeight = artist?.plan ? this.PLAN_WEIGHT[artist.plan as keyof typeof this.PLAN_WEIGHT] || 0 : 0;
        const ageInDays = this.getAgeInDays(art.date_published);
        const freshnessWeight = Math.max(this.FRESHNESS_DAYS - ageInDays, 0);
        const featuredBonus = art.is_featured ? this.FEATURED_BONUS : 0;

        const score =
            (art.likes || 0) * 5 +
            (art.views || 0) * 0.1 +
            planWeight +
            freshnessWeight +
            featuredBonus;

        return Math.round(score * 100) / 100;
    }

    private async updateScore(artId: number): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;

        const score = await this.calculateScore(art);
        await art.update({ score });
    }

    async updateAllScores(): Promise<void> {
        const arts = await this.artRepository.findAll();
        for (const art of arts) {
            const score = await this.calculateScore(art);
            await art.update({ score });
        }
        this.logger.log('info', `✅ Обновлены скоры для ${arts.length} картин`);
    }

    async addToFeatured(artId: number, days: number = this.FEATURED_DAYS): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;

        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + days);

        await art.update({
            is_featured: true,
            featured_until: featuredUntil,
        });
        await this.updateScore(artId);
    }

    async removeFromFeatured(artId: number): Promise<void> {
        const art = await this.artRepository.findByPk(artId);
        if (!art) return;

        await art.update({
            is_featured: false,
            featured_until: null,
        });
        await this.updateScore(artId);
    }

    async refreshFeaturedArts(): Promise<void> {
        const now = new Date();

        await this.artRepository.update(
            { is_featured: false, featured_until: null },
            {
                where: {
                    is_featured: true,
                    featured_until: { [Op.lt]: now },
                },
            }
        );

        const topCandidates = await this.artRepository.findAll({
            where: {
                is_featured: false,
                moderate: { [Op.ne]: null },
            },
            order: [
                ['score', 'DESC'],
                ['likes', 'DESC'],
            ],
            limit: 10,
        });

        for (const art of topCandidates) {
            await this.addToFeatured(art.id, this.FEATURED_DAYS);
        }

        this.logger.log('info', `🔄 Обновлен топ: ${topCandidates.length} картин`);
    }

    private getDefaultIncludes() {
        return [
            {
                model: ArtistProfile,
                required: false,
                attributes: ['user_id'],
                include: [
                    { model: User, attributes: ['id', 'name', 'surname', 'avatar_path'] }
                ]
            },
            { model: Genre, required: false, attributes: ['id', 'title'] },
            { model: Style, required: false, attributes: ['id', 'name'] }
        ];
    }

    private async getArtsWithFilters(page: number, limit: number, lang: string, type: 'all' | 'moderated' | 'unmoderated') {
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

    private getWeightedRandomSelection(arts: any[], limit: number): any[] {
        if (arts.length <= limit) return arts;

        const seed = new Date().toDateString();
        const shuffled = this.shuffleArray(arts, seed);

        return shuffled
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    private shuffleArray(array: any[], seed: string): any[] {
        const shuffled = [...array];
        let currentIndex = shuffled.length;
        let temporaryValue, randomIndex;

        const random = this.seededRandom(seed);

        while (currentIndex !== 0) {
            randomIndex = Math.floor(random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = shuffled[currentIndex];
            shuffled[currentIndex] = shuffled[randomIndex];
            shuffled[randomIndex] = temporaryValue;
        }

        return shuffled;
    }

    private seededRandom(seed: string): () => number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return function () {
            hash = (hash * 9301 + 49297) % 233280;
            return hash / 233280;
        };
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
            tags: dto.tags || null
        };
    }

    private formatArtResponse(art: Art) {
        const artJson = art.toJSON();
        if (artJson.moderate) {
            try {
                artJson.moderate = JSON.parse(artJson.moderate);
            } catch {
                artJson.moderate = null;
            }
        }
        return artJson;
    }

    private parseModerate(moderate: string) {
        if (!moderate) return {};
        try {
            return JSON.parse(moderate);
        } catch {
            return {};
        }
    }

    private async enrichWithLocation(art: any, lang: string) {
        let cityData = null;
        let countryData = null;

        if (art.country_id) {
            const country = await this.locationService.getCountryByCode(String(art.country_id), lang);
            if (country) {
                countryData = {
                    id: country.id,
                    name: country.name,
                    iso2: country.iso2
                };
            }
        }

        if (art.city_id && art.country_id) {
            const cities = await this.locationService.getCitiesByCountryCode(String(art.country_id), lang);
            const foundCity = cities.find(c => Number(c.id) === Number(art.city_id));
            if (foundCity) {
                cityData = {
                    id: foundCity.id,
                    name: foundCity.name,
                    country_id: foundCity.country_code
                };
            }
        }

        return {
            ...art,
            city: cityData,
            country: countryData
        };
    }

    // ✅ Обновленный метод для пакетной обработки локаций
    private async enrichWithLocationBatch(arts: any[], lang: string) {
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

    private buildPagination(total: number, page: number, limit: number) {
        const totalPages = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };
    }

    private getAgeInDays(date: Date): number {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        return diff / (1000 * 60 * 60 * 24);
    }

    private handleError(method: string, error: any, message: string): never {
        this.logger.error(`❌ ${method} failed:`, error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
}