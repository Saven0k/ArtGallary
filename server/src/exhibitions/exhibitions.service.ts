import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Exhibition } from './exhibition.model';
import { ExhibitionArt } from './exhibition-art.model';
import { Sequelize, Op, Transaction } from 'sequelize';
import { FilesService } from '../files/files.service';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { Art } from '../arts/arts.model';
import { ArtistProfile } from '../artists/artist.model';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { ExhibitionArtist } from './exhibition-artist.model';
import { ExhibitionUser } from './exhibition-user.model';
import { Genre } from '../genres/genre.model';
import { ModerateExhibitionDto } from './dto/moderate-exhibition.dto';
import { TranslationService } from 'src/translation/translation.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class ExhibitionsService {
    constructor(
        @InjectModel(Exhibition) private exhibitionRepository: typeof Exhibition,
        @InjectModel(ExhibitionArt) private exhibitionArtRepository: typeof ExhibitionArt,
        @InjectModel(ArtistProfile) private artistRepository: typeof ArtistProfile,
        @InjectModel(ExhibitionArtist) private exhibitionArtistRepository: typeof ExhibitionArtist,
        @InjectModel(ExhibitionUser) private exhibitionUserRepository: typeof ExhibitionUser,
        @InjectModel(Genre) private genreRepository: typeof Genre,
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectConnection() private sequelize: Sequelize,
        private fileService: FilesService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService,
        private locationService: LocationService,
    ) {}

    // ============ CRUD ОПЕРАЦИИ ============

    async create(dto: CreateExhibitionDto, image?: any) {
        const userId = Number(dto.owner_id);
        this.log('create', { userId });
        
        if (dto.country_id) await this.locationService.validateLocation(dto.country_id, dto.city_id);

        const transaction = await this.sequelize.transaction();
        try {
            const artistProfile = await this.getArtistProfile(userId, transaction);
            if (!artistProfile) throw new HttpException('Профиль художника не найден', 404);

            const imageUrl = image ? await this.fileService.createFile(image) : "";

            const exhibition = await this.exhibitionRepository.create({
                ...this.pick(dto, ['title', 'description', 'address', 'date', 'cost', 'currency', 'city_id', 'country_id', 'genre_id']),
                image_path: imageUrl,
                owner_id: userId,
                moderate: JSON.stringify({
                    moderate: false,
                    moderator_id: null,
                    errors: {},
                    moderated_at: null,
                    comment: null
                })
            }, { transaction });

            await this.exhibitionArtistRepository.create({
                exhibition_id: exhibition.id,
                artist_id: userId
            } as any, { transaction });

            await transaction.commit();
            return this.formatExhibitionResponse(exhibition);
        } catch (e) {
            await transaction.rollback();
            this.handleError('create', e);
        }
    }

    async update(id: number, dto: UpdateExhibitionDto, image?: any, userId?: number) {
        if (!dto) throw new HttpException('Нет данных для обновления', 400);
        if (!userId) throw new HttpException('Не авторизован', 401);
        if (dto.country_id) await this.locationService.validateLocation(dto.country_id, dto.city_id);

        try {
            const exhibition = await this.getExhibition(id);
            const artistProfile = await this.getOrCreateArtistProfile(userId);
            
            if (!this.isOwner(exhibition, artistProfile, userId)) {
                throw new HttpException('У вас нет прав на редактирование этой выставки', 403);
            }

            const updateData = await this.buildUpdateData(dto, image, exhibition);
            if (Object.keys(updateData).length) {
                await this.exhibitionRepository.update(updateData, { where: { id } });
            }

            await this.updateRelations(id, dto, exhibition, artistProfile);

            return this.getExhibition(id);
        } catch (e) {
            this.handleError('update', e);
        }
    }

    async remove(id: number) {
        this.log('remove', { exhibitionId: id });

        const transaction = await this.sequelize.transaction();
        try {
            const exhibition = await this.getExhibition(id);
            if (!exhibition) throw new NotFoundException(`Выставка с ID ${id} не найдена`);

            await this.exhibitionArtistRepository.destroy({ where: { exhibition_id: id }, transaction });
            await this.exhibitionArtRepository.destroy({ where: { exhibition_id: id }, transaction });
            await this.exhibitionRepository.destroy({ where: { id }, transaction });

            await transaction.commit();
            return { success: true, message: 'Выставка удалена' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('remove', e);
        }
    }

    // ============ УПРАВЛЕНИЕ СВЯЗЯМИ ============

    async addArt(exhibitionId: number, artId: number) {
        return this.manageRelation(exhibitionId, artId, 'art', 'add');
    }

    async deleteArt(exhibitionId: number, artId: number) {
        return this.manageRelation(exhibitionId, artId, 'art', 'remove');
    }

    async addArtist(exhibitionId: number, artistId: number) {
        return this.manageRelation(exhibitionId, artistId, 'artist', 'add');
    }

    async deleteArtist(exhibitionId: number, artistId: number) {
        return this.manageRelation(exhibitionId, artistId, 'artist', 'remove');
    }

    private async manageRelation(exhibitionId: number, relatedId: number, type: 'art' | 'artist', action: 'add' | 'remove') {
        this.log(`${action}${type}`, { exhibitionId, relatedId });

        const transaction = await this.sequelize.transaction();
        try {
            const exhibition = await this.getExhibition(exhibitionId);
            if (!exhibition) throw new NotFoundException(`Выставка с ID ${exhibitionId} не найдена`);

            if (type === 'art') {
                await this.manageArtRelation(exhibitionId, relatedId, action, transaction);
            } else {
                await this.manageArtistRelation(exhibitionId, relatedId, action, transaction);
            }

            await transaction.commit();
            return { success: true };
        } catch (e) {
            await transaction.rollback();
            this.handleError(`${action}${type}`, e);
        }
    }

    private async manageArtRelation(exhibitionId: number, artId: number, action: 'add' | 'remove', transaction: Transaction) {
        const exists = await this.exhibitionArtRepository.findOne({
            where: { exhibition_id: exhibitionId, art_id: artId },
            transaction
        });

        if (action === 'add' && exists) {
            throw new HttpException('Картина уже добавлена', 400);
        }
        if (action === 'remove' && !exists) {
            throw new HttpException('Картина не найдена', 400);
        }

        if (action === 'add') {
            await this.exhibitionArtRepository.create({
                exhibition_id: exhibitionId,
                art_id: artId
            }, { transaction });
        } else {
            await this.exhibitionArtRepository.destroy({
                where: { exhibition_id: exhibitionId, art_id: artId },
                transaction
            });
        }
    }

    private async manageArtistRelation(exhibitionId: number, artistId: number, action: 'add' | 'remove', transaction: Transaction) {
        const exists = await this.exhibitionArtistRepository.findOne({
            where: { exhibition_id: exhibitionId, artist_id: artistId },
            transaction
        });

        if (action === 'add' && exists) {
            throw new HttpException('Художник уже добавлен', 400);
        }
        if (action === 'remove' && !exists) {
            throw new HttpException('Художник не найден', 400);
        }

        if (action === 'add') {
            await this.exhibitionArtistRepository.create({
                exhibition_id: exhibitionId,
                artist_id: artistId
            }, { transaction });
        } else {
            await this.exhibitionArtistRepository.destroy({
                where: { exhibition_id: exhibitionId, artist_id: artistId },
                transaction
            });
        }
    }

    // ============ РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ============

    async signUp(exhibitionId: number, userId: number) {
        this.log('signUp', { exhibitionId, userId });

        const transaction = await this.sequelize.transaction();
        try {
            const exhibition = await this.getExhibition(exhibitionId);
            if (!exhibition) throw new NotFoundException(`Выставка с ID ${exhibitionId} не найдена`);

            const user = await this.userRepository.findByPk(userId);
            if (!user) throw new NotFoundException(`Пользователь с ID ${userId} не найден`);

            const existing = await this.exhibitionUserRepository.findOne({
                where: { exhibition_id: exhibitionId, user_id: userId }
            });
            if (existing) throw new HttpException('Пользователь уже зарегистрирован', 400);

            await this.exhibitionUserRepository.create({
                exhibition_id: exhibitionId,
                user_id: userId
            }, { transaction });

            await this.exhibitionRepository.update(
                { visitors_count: (exhibition.visitors_count || 0) + 1 },
                { where: { id: exhibitionId }, transaction }
            );

            await transaction.commit();
            return { success: true, message: 'Вы успешно записаны на выставку' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('signUp', e);
        }
    }

    async cancelSignUp(exhibitionId: number, userId: number) {
        this.log('cancelSignUp', { exhibitionId, userId });

        const transaction = await this.sequelize.transaction();
        try {
            const exhibition = await this.getExhibition(exhibitionId);
            if (!exhibition) throw new NotFoundException(`Выставка с ID ${exhibitionId} не найдена`);

            const registration = await this.exhibitionUserRepository.findOne({
                where: { exhibition_id: exhibitionId, user_id: userId }
            });
            if (!registration) throw new HttpException('Пользователь не зарегистрирован', 400);

            await registration.destroy({ transaction });

            await this.exhibitionRepository.update(
                { visitors_count: Math.max((exhibition.visitors_count || 0) - 1, 0) },
                { where: { id: exhibitionId }, transaction }
            );

            await transaction.commit();
            return { success: true };
        } catch (e) {
            await transaction.rollback();
            this.handleError('cancelSignUp', e);
        }
    }

    async moderate(moderateDto: ModerateExhibitionDto, id: number) {
        this.log('moderate', { exhibitionId: id });

        const transaction = await this.sequelize.transaction();
        try {
            const exhibition = await this.getExhibition(id);
            if (!exhibition) throw new NotFoundException(`Выставка с ID ${id} не найдена`);

            const currentModerate = this.parseModerate(exhibition.moderate);
            const moderateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null,
                previous_moderate: currentModerate
            };

            await this.exhibitionRepository.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { id }, transaction }
            );

            await transaction.commit();
            return this.findOne(id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('moderate', e);
        }
    }

    // ============ GET МЕТОДЫ ============

    async findOne(id: number, lang: string = 'ru') {
        this.log('findOne', { exhibitionId: id, lang });

        const exhibition = await this.getExhibition(id);
        if (!exhibition) throw new HttpException('Выставка не найдена', HttpStatus.NOT_FOUND);

        const location = await this.getLocationData(exhibition.country_id, exhibition.city_id, lang);
        const genre = exhibition.genre_id 
            ? await this.genreRepository.findByPk(exhibition.genre_id, { attributes: ['id', 'title'] })
            : null;

        const [arts, artists] = await Promise.all([
            this.getExhibitionArts(id),
            this.getExhibitionArtists(id)
        ]);

        let result = {
            ...exhibition.toJSON(),
            ...location,
            genre: genre ? { id: genre.id, name: genre.title } : null,
            arts,
            artists,
            moderate: this.parseModerate(exhibition.moderate)?.moderate || false,
        };

        return this.translateIfNeeded(result, 'exhibition', lang);
    }

    async getAll(page: number = 1, limit: number = 10, lang: string = 'ru') {
        this.log('getAll', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.exhibitionRepository.findAndCountAll({
            limit,
            offset,
            order: [['date', 'DESC']]
        });

        if (!rows.length) {
            return { data: [], pagination: this.buildPagination(0, page, limit) };
        }

        const exhibitionIds = rows.map(ex => ex.id);
        const [locationMap, genreMap, artsMap, artistsMap] = await Promise.all([
            this.getLocationMap(rows),
            this.getGenreMap(rows),
            this.getArtsMap(exhibitionIds),
            this.getArtistsMap(exhibitionIds)
        ]);

        const formatted = rows.map(ex => ({
            ...ex.toJSON(),
            city: locationMap.get(ex.id)?.city || null,
            country: locationMap.get(ex.id)?.country || null,
            genre: genreMap.get(ex.genre_id) || null,
            arts: artsMap.get(ex.id) || [],
            artists: artistsMap.get(ex.id) || []
        }));

        return this.translateIfNeeded(formatted, 'exhibition', lang);
    }

    async getModeratedExhibitions(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getExhibitionsByModerationStatus(true, page, limit, lang);
    }

    async getUnmoderatedExhibitions(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getExhibitionsByModerationStatus(false, page, limit, lang);
    }

    async getByOwnerId(ownerId: number, lang: string = 'ru') {
        this.log('getByOwnerId', { ownerId, lang });

        const artistProfile = await this.artistRepository.findOne({ where: { user_id: ownerId } });
        if (!artistProfile) return [];

        const exhibitions = await this.exhibitionRepository.findAll({
            where: { owner_id: artistProfile.id },
            include: [
                { model: ArtistProfile, as: 'artists', through: { attributes: [] } },
                { model: Art, as: 'arts', through: { attributes: [] } },
                { model: Genre, as: 'genre' }
            ],
            order: [['date', 'DESC']]
        });

        const formatted = await this.enrichWithLocation(exhibitions, lang);
        return this.translateIfNeeded(formatted, 'exhibition', lang);
    }

    async getByParticipantArtistId(artistId: number, lang: string = 'ru') {
        this.log('getByParticipantArtistId', { artistId, lang });

        const artistProfile = await this.artistRepository.findOne({ where: { user_id: artistId } });
        if (!artistProfile) return [];

        const exhibitionArtists = await this.exhibitionArtistRepository.findAll({
            where: { artist_id: artistProfile.id },
            include: [{
                model: Exhibition,
                required: true,
                where: { owner_id: { [Op.ne]: artistProfile.id } }
            }]
        });

        const exhibitionIds = exhibitionArtists.map(item => item.exhibition_id);
        if (!exhibitionIds.length) return [];

        const exhibitions = await this.exhibitionRepository.findAll({
            where: { id: { [Op.in]: exhibitionIds } },
            include: [{ model: Genre, as: 'genre' }],
            order: [['date', 'DESC']]
        });

        const formatted = await this.enrichWithLocation(exhibitions, lang);
        return this.translateIfNeeded(formatted, 'exhibition', lang);
    }

    async getAllArtistExhibitions(artistId: number, lang: string = 'ru') {
        this.log('getAllArtistExhibitions', { artistId, lang });

        const artistProfile = await this.artistRepository.findOne({ where: { user_id: artistId } });
        if (!artistProfile) return [];

        const ownedIds = await this.exhibitionRepository.findAll({
            where: { owner_id: artistProfile.user_id },
            attributes: ['id']
        });

        const participatedIds = await this.exhibitionArtistRepository.findAll({
            where: { artist_id: artistProfile.user_id },
            attributes: ['exhibition_id']
        });

        const exhibitionIds = new Set([
            ...ownedIds.map(ex => ex.id),
            ...participatedIds.map(item => item.exhibition_id)
        ]);

        if (!exhibitionIds.size) return [];

        const exhibitions = await this.exhibitionRepository.findAll({
            where: { id: { [Op.in]: Array.from(exhibitionIds) } },
            include: [{ model: Genre, as: 'genre' }],
            order: [['date', 'DESC']]
        });

        const formatted = await this.enrichWithLocation(exhibitions, lang);
        return this.translateIfNeeded(formatted, 'exhibition', lang);
    }

    async getUserRegisteredExhibitions(userId: number, lang: string = 'ru') {
        this.log('getUserRegisteredExhibitions', { userId, lang });

        const registrations = await this.exhibitionUserRepository.findAll({
            where: { user_id: userId },
            attributes: ['exhibition_id']
        });

        const exhibitionIds = registrations.map(r => r.exhibition_id);
        if (!exhibitionIds.length) return [];

        let exhibitions = await this.exhibitionRepository.findAll({
            where: { id: exhibitionIds }
        });

        return this.translateIfNeeded(exhibitions, 'exhibition', lang);
    }

    async getRegisteredUsersCount(exhibitionId: number): Promise<number> {
        return this.exhibitionUserRepository.count({ where: { exhibition_id: exhibitionId } });
    }

    async isUserRegisteredToExhibition(exhibitionId: number, userId: number): Promise<boolean> {
        const registration = await this.exhibitionUserRepository.findOne({
            where: { exhibition_id: exhibitionId, user_id: userId }
        });
        return !!registration;
    }

    async checkSignUpStatus(exhibitionId: number, userId: number): Promise<boolean> {
        return this.isUserRegisteredToExhibition(exhibitionId, userId);
    }

    // ============ ПРИВАТНЫЕ МЕТОДЫ ============

    private async getExhibition(id: number) {
        return this.exhibitionRepository.findByPk(id);
    }

    private async getArtistProfile(userId: number, transaction?: Transaction) {
        return this.artistRepository.findOne({ where: { user_id: userId }, transaction });
    }

    private async getOrCreateArtistProfile(userId: number) {
        let profile = await this.artistRepository.findOne({ where: { user_id: userId } });
        if (!profile) {
            profile = await this.artistRepository.create({
                user_id: userId,
                biography: '',
                date_birthday: null
            } as any);
        }
        return profile;
    }

    private isOwner(exhibition: Exhibition, artistProfile: ArtistProfile, userId: number): boolean {
        return exhibition.owner_id === artistProfile.id || exhibition.owner_id === userId;
    }

    private async getExhibitionArts(exhibitionId: number) {
        const items = await this.exhibitionArtRepository.findAll({
            where: { exhibition_id: exhibitionId },
            include: [{
                model: Art,
                attributes: ['id', 'title', 'image_path', 'cost', 'likes', 'date_published']
            }],
            raw: true,
            nest: true
        });

        return items.filter(item => item.art).map(item => ({
            id: item.art!.id,
            title: item.art!.title,
            image_path: item.art!.image_path,
            cost: item.art!.cost,
            likes: item.art!.likes,
            date_published: item.art!.date_published
        }));
    }

    private async getExhibitionArtists(exhibitionId: number) {
        const items = await this.exhibitionArtistRepository.findAll({
            where: { exhibition_id: exhibitionId },
            include: [{
                model: ArtistProfile,
                attributes: ['user_id', 'biography', 'date_birthday'],
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'surname', 'avatar_path', 'email', 'phone_number']
                }]
            }],
            raw: true,
            nest: true
        });

        return items.filter(item => item.artistProfile).map(item => ({
            user_id: item.artistProfile!.user_id,
            biography: item.artistProfile!.biography,
            date_birthday: item.artistProfile!.date_birthday,
            user: item.artistProfile!.user ? {
                id: item.artistProfile!.user.id,
                name: item.artistProfile!.user.name,
                surname: item.artistProfile!.user.surname,
                avatar_path: item.artistProfile!.user.avatar_path,
                email: item.artistProfile!.user.email,
                phone_number: item.artistProfile!.user.phone_number
            } : null
        }));
    }

    private async getExhibitionsByModerationStatus(moderated: boolean, page: number, limit: number, lang: string) {
        this.log('getExhibitionsByModerationStatus', { moderated, page, limit, lang });

        const offset = (page - 1) * limit;
        const { rows } = await this.exhibitionRepository.findAndCountAll({
            limit,
            offset,
            include: [{ model: Genre, attributes: ['id', 'title'] }],
            order: [['createdAt', 'DESC']],
            distinct: true,
            raw: true,
            nest: true
        });

        const filtered = rows.filter(ex => {
            if (!ex.moderate) return !moderated;
            try {
                return JSON.parse(ex.moderate).moderate === moderated;
            } catch {
                return !moderated;
            }
        });

        const enriched = await this.enrichWithLocation(filtered, lang);
        const translated = await this.translateIfNeeded(enriched, 'exhibition', lang);
        return { data: translated, pagination: this.buildPagination(filtered.length, page, limit) };
    }

    private async enrichWithLocation(exhibitions: any[], lang: string) {
        const locationMap = await this.getLocationMap(exhibitions);
        return exhibitions.map(ex => ({
            ...ex,
            city: locationMap.get(ex.id)?.city || null,
            country: locationMap.get(ex.id)?.country || null
        }));
    }

    private async getLocationData(countryId: number, cityId: number, lang: string) {
        let country = null;
        let city = null;

        if (countryId) country = await this.locationService.getCountryById(countryId, lang);
        if (cityId && countryId) {
            const cities = await this.locationService.getCitiesByCountry(countryId, lang);
            city = cities.find(c => c.id === cityId) || null;
        }

        return { city, country };
    }

    private async getLocationMap(exhibitions: any[]) {
        const map = new Map<number, { city: any; country: any }>();
        const countryIds = [...new Set(exhibitions.map(ex => ex.country_id).filter(Boolean))];

        for (const id of countryIds) {
            const country = await this.locationService.getCountryById(id, 'ru');
            if (country) {
                const cities = await this.locationService.getCitiesByCountry(id, 'ru');
                exhibitions.forEach(ex => {
                    if (ex.country_id === id) {
                        const city = cities.find(c => c.id === ex.city_id) || null;
                        if (!map.has(ex.id)) {
                            map.set(ex.id, { city, country });
                        } else {
                            const data = map.get(ex.id);
                            if (!data.city) data.city = city;
                            if (!data.country) data.country = country;
                        }
                    }
                });
            }
        }

        return map;
    }

    private async getGenreMap(exhibitions: any[]) {
        const genreIds = [...new Set(exhibitions.map(ex => ex.genre_id).filter(Boolean))];
        const genres = await this.genreRepository.findAll({
            where: { id: genreIds },
            attributes: ['id', 'title']
        });
        return new Map(genres.map(g => [g.id, g]));
    }

    private async getArtsMap(exhibitionIds: number[]) {
        const items = await this.exhibitionArtRepository.findAll({
            where: { exhibition_id: exhibitionIds },
            include: [{
                model: Art,
                attributes: ['id', 'title', 'image_path', 'cost', 'likes']
            }],
            raw: true,
            nest: true
        });

        const map = new Map<number, any[]>();
        items.forEach(item => {
            if (item.art) {
                const list = map.get(item.exhibition_id) || [];
                list.push({
                    id: item.art.id,
                    title: item.art.title,
                    image_path: item.art.image_path,
                    cost: item.art.cost,
                    likes: item.art.likes
                });
                map.set(item.exhibition_id, list);
            }
        });
        return map;
    }

    private async getArtistsMap(exhibitionIds: number[]) {
        const items = await this.exhibitionArtistRepository.findAll({
            where: { exhibition_id: exhibitionIds },
            include: [{
                model: ArtistProfile,
                attributes: ['user_id'],
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'surname', 'avatar_path']
                }]
            }],
            raw: true,
            nest: true
        });

        const map = new Map<number, any[]>();
        items.forEach(item => {
            if (item.artistProfile) {
                const list = map.get(item.exhibition_id) || [];
                list.push({
                    user_id: item.artistProfile.user_id,
                    user: item.artistProfile.user ? {
                        id: item.artistProfile.user.id,
                        name: item.artistProfile.user.name,
                        surname: item.artistProfile.user.surname,
                        avatar_path: item.artistProfile.user.avatar_path
                    } : null
                });
                map.set(item.exhibition_id, list);
            }
        });
        return map;
    }

    private async buildUpdateData(dto: UpdateExhibitionDto, image: any, exhibition: Exhibition) {
        const data: any = this.pick(dto, [
            'title', 'description', 'address', 'date', 'cost', 'currency',
            'visitors_count', 'city_id', 'country_id', 'genre_id', 'likes', 'views'
        ]);

        if (image) {
            data.image_path = await this.fileService.createFile(image);
            if (exhibition.image_path) {
                this.fileService.removeFile(exhibition.image_path).catch(console.error);
            }
        }

        return data;
    }

    private async updateRelations(id: number, dto: UpdateExhibitionDto, exhibition: Exhibition, artistProfile: ArtistProfile) {
        if (dto.artist_ids !== undefined) {
            await this.exhibitionUserRepository.destroy({ where: { exhibition_id: id } });
            const ownerId = exhibition.owner_id === artistProfile.id ? exhibition.owner_id : artistProfile.id;
            const allIds = [...new Set([ownerId, ...dto.artist_ids])];
            for (const artistId of allIds) {
                if (artistId && !isNaN(artistId)) {
                    await this.exhibitionUserRepository.create({ exhibition_id: id, artist_id: artistId } as any);
                }
            }
        }

        if (dto.art_ids !== undefined) {
            await this.exhibitionArtRepository.destroy({ where: { exhibition_id: id } });
            for (const artId of dto.art_ids) {
                if (artId && !isNaN(artId)) {
                    await this.exhibitionArtRepository.create({ exhibition_id: id, art_id: artId } as any);
                }
            }
        }
    }

    private formatExhibitionResponse(exhibition: Exhibition) {
        const json = exhibition.toJSON();
        if (json.moderate) {
            try {
                json.moderate = JSON.parse(json.moderate);
            } catch {
                json.moderate = null;
            }
        }
        return json;
    }

    private parseModerate(moderate: string) {
        if (!moderate) return null;
        try {
            return JSON.parse(moderate);
        } catch {
            return null;
        }
    }

    private buildPagination(total: number, page: number, limit: number) {
        const totalPages = Math.ceil(total / limit);
        return {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };
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

    private log(method: string, data: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'ExhibitionsService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ Ошибка в ${method}`,
            context: 'ExhibitionsService',
            error: error.message,
            stack: error.stack,
        }));

        if (error instanceof HttpException || error instanceof NotFoundException) {
            throw error;
        }

        throw new HttpException(
            `Ошибка в ${method}: ${error.message}`,
            400
        );
    }
}