import { ConflictException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/users.model';
import { ArtistProfile } from './artist.model';
import { Sequelize, Transaction } from 'sequelize';
import { CreateArtistDto } from './dto/create-artist.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import bcrypt from 'bcryptjs';
import { FilesService } from '../files/files.service';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { PasswordService } from '../password/password.service';
import { ModerateArtistDto } from './dto/modarate-artist.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Art } from '../arts/arts.model';
import { Exhibition } from '../exhibitions/exhibition.model';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { ExhibitionArtist } from '../exhibitions/exhibition-artist.model';
import { TranslationService } from 'src/translation/translation.service';
import { LocationService } from 'src/location/location.service';
import { ModerateObject, ModerateResponse } from 'src/types/moderate.types';

@Injectable()
export class ArtistsService {
    private readonly userAttributes = [
        'id', 'email', 'name', 'surname', 'second_name',
        'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt'
    ];

    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @InjectModel(ExhibitionArtist) private exhibitionArtistRepository: typeof ExhibitionArtist,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectConnection() private sequelize: Sequelize,
        private fileSerivce: FilesService,
        private passwordService: PasswordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService,
        private locationService: LocationService,
    ) {}

    // ============ CRUD ОПЕРАЦИИ ============

    async createArtist(dto: CreateArtistDto, image: any) {
        this.log('createArtist', { email: dto.email });
        if (dto.country_id) await this.locationService.validateLocation(dto.country_id, dto.city_id);

        const transaction = await this.sequelize.transaction();
        try {
            await this.checkEmailExists(dto.email, transaction);

            const hashedPassword = await bcrypt.hash(dto.password, 5);
            const avatarPath = image ? await this.fileSerivce.createFile(image) : "";

            const user = await this.userRepository.create({
                ...this.pick(dto, ['email', 'name', 'surname', 'second_name', 'phone_number']),
                password: hashedPassword,
                avatar_path: avatarPath,
                role: 'artist',
            }, { transaction });

            await this.artistProfileModel.create({
                user_id: user.id,
                ...this.pick(dto, ['biography', 'date_birthday', 'city_id', 'country_id', 'profession']),
                moderate: JSON.stringify({ moderate: false, moderator_id: null, errors: {} }),
            }, { transaction });

            await transaction.commit();
            return user.toJSON ? user.toJSON() : user;
        } catch (e) {
            await transaction.rollback();
            this.handleError('createArtist', e);
        }
    }

    async updateArtist(id: number, dto: UpdateArtistDto, image: any) {
        if (dto.country_id) await this.locationService.validateLocation(dto.country_id, dto.city_id);

        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            if (dto.email && dto.email !== user.email) {
                await this.checkEmailExists(dto.email, transaction);
            }

            const userData = await this.buildUserUpdateData(dto, image, user);
            if (Object.keys(userData).length) {
                await this.userRepository.update(userData, { where: { id: user.id }, transaction });
            }

            const profileData = this.buildProfileUpdateData(dto);
            if (Object.keys(profileData).length) {
                await this.artistProfileModel.update(profileData, { where: { user_id: user.id }, transaction });
            }

            await transaction.commit();
            return this.getUserWithProfile(user.id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('updateArtist', e);
        }
    }

    async deleteArtist(id: number) {
        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            const artist = await this.getArtistProfile(user.id, transaction);

            if (user.avatar_path) await this.fileSerivce.removeFile(user.avatar_path);

            const arts = await this.artRepository.findAll({ where: { artist_id: user.id }, transaction });
            for (const art of arts) {
                if (art.image_path) await this.fileSerivce.removeFile(art.image_path);
                await art.destroy({ transaction });
            }

            await this.exhibitionArtistRepository.destroy({ where: { artist_id: artist.user_id }, transaction });
            await artist.destroy({ transaction });
            await user.destroy({ transaction });

            await transaction.commit();
            return { success: true, message: 'Артист полностью удален' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('deleteArtist', e);
        }
    }

    // ============ GET МЕТОДЫ ============

    async getArtistById(id: number, lang: string = 'ru') {
        this.log('getArtistById', { artistId: id, lang });

        const user = await this.userRepository.findOne({
            where: { id, role: 'artist' },
            attributes: this.userAttributes,
        });

        if (!user) return null;

        const profile = await this.getArtistProfile(id);
        const stats = await this.getArtistStats(id);
        const location = await this.getLocationData(profile?.country_id, profile?.city_id, lang);
        const moderate = this.parseModerate(profile?.moderate);

        let result = {
            ...user.toJSON(),
            artistProfile: profile ? {
                ...this.pick(profile, ['user_id', 'date_birthday', 'biography', 'city_id', 'country_id', 'profession']),
                moderate,
                ...location,
                ...stats,
            } : null,
        };

        return this.translateIfNeeded(result, 'artist', lang);
    }

    async getAll(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.log('getAll', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'artist' },
            attributes: this.userAttributes,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        if (!rows.length) return { data: [], pagination: this.buildPagination(0, page, limit) };

        const profiles = await this.getArtistProfiles(rows.map(u => u.id));
        const artsMap = await this.getArtsMap(rows.map(u => u.id));
        const locationMap = await this.getLocationMap(profiles, lang);

        const formatted = rows.map(user => {
            const profile = profiles.get(user.id);
            const location = profile?.country_id ? locationMap.get(profile.country_id) : null;
            const cityData = profile?.city_id ? location?.cities?.get(profile.city_id) : null;

            return {
                ...user.toJSON(),
                artistProfile: profile ? {
                    ...this.pick(profile, ['user_id', 'date_birthday', 'biography', 'moderate', 'city_id', 'country_id']),
                    city: cityData || null,
                    country: location?.country || null,
                    arts: artsMap.get(user.id) || [],
                } : null,
            };
        });

        const translated = await this.translateIfNeeded(formatted, 'artist', lang);
        return { data: translated, pagination: this.buildPagination(count, page, limit) };
    }

    async getUnmoderatedArtists(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtistsByModerationStatus(false, page, limit, lang);
    }

    async getModeratedArtists(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtistsByModerationStatus(true, page, limit, lang);
    }

    async getArtsByArtist(artistId: number, lang: string = 'ru') {
        this.log('getArtsByArtist', { artistId, lang });

        const profile = await this.artistProfileModel.findOne({ where: { user_id: artistId } });
        if (!profile) return [];

        let arts = await this.artRepository.findAll({
            where: { artist_id: profile.user_id },
            include: [
                { model: Genre, attributes: ['id', 'title'] },
                { model: Style, attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        return this.translateIfNeeded(arts, 'art', lang);
    }

    async getExhibitionsByArtist(artistId: number, lang: string = 'ru') {
        this.log('getExhibitionsByArtist', { artistId, lang });

        const artist = await this.artistProfileModel.findOne({
            where: { user_id: artistId },
            include: [{ model: Exhibition }],
        });

        if (!artist) throw new NotFoundException('Артист не найден');

        let exhibitions = artist.exhibitions || [];
        return this.translateIfNeeded(exhibitions, 'exhibition', lang);
    }

    async moderateArtist(moderateDto: ModerateArtistDto, artistId: number): Promise<ModerateResponse> {
        this.log('moderateArtist', { artistId, moderate: moderateDto.moderate });

        const transaction = await this.sequelize.transaction();
        try {
            const artist = await this.artistProfileModel.findOne({
                where: { user_id: artistId },
                transaction,
            });

            if (!artist) throw new NotFoundException('Профиль артиста не найден');

            const moderateObject: ModerateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null,
            };

            const [affected] = await this.artistProfileModel.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { user_id: artistId }, transaction }
            );

            if (!affected) throw new NotFoundException('Профиль артиста не найден');

            await transaction.commit();
            return {
                success: true,
                message: moderateDto.moderate ? 'Артист прошел модерацию' : 'Артист отклонен',
                data: moderateObject,
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('moderateArtist', e);
        }
    }

    // ============ ПРИВАТНЫЕ МЕТОДЫ ============

    private async getArtistsByModerationStatus(moderated: boolean, page: number, limit: number, lang: string) {
        this.log('getArtistsByModerationStatus', { moderated, page, limit, lang });

        const offset = (page - 1) * limit;
        const { rows } = await this.userRepository.findAndCountAll({
            where: { role: 'artist' },
            attributes: this.userAttributes,
            include: [{ model: ArtistProfile, required: true }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        const filtered = rows.filter(user => {
            const moderate = user.artistProfile?.moderate;
            if (!moderate) return !moderated;
            try {
                return JSON.parse(moderate).moderate === moderated;
            } catch {
                return !moderated;
            }
        });

        const formatted = await Promise.all(filtered.map(async (user) => {
            const location = await this.getLocationData(
                user.artistProfile?.country_id,
                user.artistProfile?.city_id,
                lang
            );
            return {
                ...user.toJSON(),
                artistProfile: {
                    ...user.artistProfile?.toJSON(),
                    ...location,
                },
            };
        }));

        const translated = await this.translateIfNeeded(formatted, 'artist', lang);
        return { data: translated, pagination: this.buildPagination(filtered.length, page, limit) };
    }

    private async getUser(id: number, transaction?: Transaction) {
        const user = await this.userRepository.findOne({ where: { id }, transaction });
        if (!user) throw new HttpException('Артист не найден', 404);
        return user;
    }

    private async getArtistProfile(userId: number, transaction?: Transaction) {
        return this.artistProfileModel.findOne({
            where: { user_id: userId },
            transaction,
        });
    }

    private async getUserWithProfile(id: number) {
        return this.userRepository.findOne({
            where: { id },
            include: [{ model: this.artistProfileModel, as: 'artistProfile' }],
        });
    }

    private async checkEmailExists(email: string, transaction?: Transaction) {
        const existing = await this.userRepository.findOne({ where: { email }, transaction });
        if (existing) throw new ConflictException('Пользователь с таким email уже существует');
    }

    private async getArtistStats(artistId: number) {
        const artsCount = await this.artRepository.count({ where: { artist_id: artistId } });
        const exhibitionsCount = await this.exhibitionArtistRepository.count({ where: { artist_id: artistId } });
        const arts = await this.artRepository.findAll({ where: { artist_id: artistId }, attributes: ['likes'] });
        const totalLikes = arts.reduce((sum, a) => sum + (a.likes || 0), 0);

        return { artsCount, exhibitionsCount, totalLikes };
    }

    private async getLocationData(countryId: number, cityId: number, lang: string) {
        let countryData = null;
        let cityData = null;

        if (countryId) {
            countryData = await this.locationService.getCountryById(countryId, lang);
        }
        if (cityId && countryId) {
            const cities = await this.locationService.getCitiesByCountry(countryId, lang);
            cityData = cities.find(c => c.id === cityId) || null;
        }

        return { city: cityData, country: countryData };
    }

    private async getArtistProfiles(userIds: number[]) {
        const profiles = await this.artistProfileModel.findAll({
            where: { user_id: userIds },
        });
        return new Map(profiles.map(p => [p.user_id, p]));
    }

    private async getArtsMap(userIds: number[]) {
        const arts = await this.artRepository.findAll({
            where: { artist_id: userIds },
            attributes: ['id', 'title', 'image_path', 'likes', 'date_published', 'artist_id'],
            limit: 5,
        });

        const map = new Map<number, any[]>();
        arts.forEach(art => {
            const list = map.get(art.artist_id) || [];
            list.push(art);
            map.set(art.artist_id, list);
        });
        return map;
    }

    private async getLocationMap(profiles: Map<number, ArtistProfile>, lang: string) {
        const countryIds = [...new Set([...profiles.values()].map(p => p.country_id).filter(Boolean))];
        const map = new Map<number, { country: any; cities: Map<number, any> }>();

        for (const id of countryIds) {
            const country = await this.locationService.getCountryById(id, lang);
            if (country) {
                const cities = await this.locationService.getCitiesByCountry(id, lang);
                const citiesMap = new Map(cities.map(c => [c.id, c]));
                map.set(id, { country, cities: citiesMap });
            }
        }

        return map;
    }

    private async buildUserUpdateData(dto: UpdateArtistDto, image: any, user: any) {
        const data: any = this.pick(dto, ['email', 'name', 'surname', 'second_name', 'phone_number']);

        if (dto.password) {
            data.password = await this.passwordService.hashPassword(dto.password);
        }

        if (image) {
            data.avatar_path = await this.fileSerivce.createFile(image);
            if (user.avatar_path) {
                await this.fileSerivce.removeFile(user.avatar_path);
            }
        }

        return data;
    }

    private buildProfileUpdateData(dto: UpdateArtistDto) {
        return this.pick(dto, [
            'biography', 'date_birthday', 'city_id', 'country_id',
            'likes', 'views', 'profession'
        ]);
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
            hasPreviousPage: page > 1,
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
            context: 'ArtistsService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ Ошибка в ${method}`,
            context: 'ArtistsService',
            error: error.message,
            stack: error.stack,
        }));

        if (error instanceof HttpException || error instanceof ConflictException) {
            throw error;
        }

        throw new HttpException(
            `Ошибка в ${method}: ${error.message}`,
            400
        );
    }
}