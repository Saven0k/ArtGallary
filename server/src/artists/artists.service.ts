import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/users.model';
import { ArtistProfile } from './artist.model';
import { Op, Sequelize, Transaction } from 'sequelize';
import { CreateArtistDto } from './dto/create-artist.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FilesService } from '../files/files.service';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { PasswordService } from '../password/password.service';
import { ModerateArtistDto } from './dto/modarate-artist.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Art } from '../arts/arts.model';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { ModerateObject, ModerateResponse } from 'src/types/moderate.types';
import { Profession } from 'src/professions/profession.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';

// ==================== TYPES ====================

export interface ArtistUserResponse {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number?: string;
    avatar_path?: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    artistProfile?: ArtistProfileResponse | null;
}

export interface ArtistProfileResponse {
    user_id: number;
    date_birthday: Date;
    biography: string;
    moderate: ModerateObject | null;
    profession_id: number;
    plan: string;
    planExpiresAt: Date | null;
    planStatus: boolean;
    likes: number;
    views: number;
    is_deleted: boolean;
    deleted_at: Date | null;
    createdAt: Date;
    updatedAt: Date;
    artsCount?: number;
    totalLikes?: number;
    score?: number;
    planWeight?: number;
    isSubscriptionActive?: boolean;
    arts?: any[];
}

export interface ArtistListItemResponse extends ArtistUserResponse {
    artistProfile?: ArtistProfileResponse & {
        arts?: any[];
    };
}

export interface ArtistListResponse {
    data: ArtistListItemResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface ArtistStatsResponse {
    artsCount: number;
    totalLikes: number;
}

export interface DeleteArtistResponse {
    success: boolean;
    message: string;
}

export interface RestoreArtistResponse {
    success: boolean;
    message: string;
}

export interface ScoredArtistResponse extends ArtistUserResponse {
    artistProfile: ArtistProfileResponse & {
        score: number;
        totalLikes: number;
        artsCount: number;
        planWeight: number;
        isSubscriptionActive: boolean;
    };
}

// ==================== SERVICE ====================

@Injectable()
export class ArtistsService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectModel(Profession) private professionModel: typeof Profession,
        @InjectConnection() private sequelize: Sequelize,
        private fileService: FilesService,
        private passwordService: PasswordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }

    // ==================== PUBLIC METHODS ====================

    async createArtist(dto: CreateArtistDto, image: any): Promise<ArtistUserResponse> {
        this.log('createArtist', { email: dto.email });

        const transaction = await this.sequelize.transaction();

        try {
            if (dto.profession_id) {
                const profession = await this.professionModel.findByPk(dto.profession_id, { transaction });
                if (!profession) {
                    throw new HttpException(`Профессия с ID ${dto.profession_id} не найдена`, 400);
                }
            }

            await this.checkEmailExists(dto.email, transaction);
            const hashedPassword = await this.passwordService.hashPassword(dto.password);
            const avatarPath = image ? await this.fileService.createFile(image) : "";

            const user = await this.userRepository.create({
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                surname: dto.surname,
                second_name: dto.second_name || '',
                phone_number: dto.phone_number,
                gender: dto.gender as 'M' | 'F',
                avatar_path: avatarPath,
                role: 'artist',
                city_id: dto.city_id || null,
                country_id: dto.country_id || null,
            }, { transaction });

            await this.artistProfileModel.create({
                user_id: user.id,
                biography: dto.biography,
                date_birthday: dto.date_birthday,
                profession_id: dto.profession_id,
                moderate: JSON.stringify({ moderate: false, moderator_id: null, errors: {} }),
            }, { transaction });

            await transaction.commit();
            return this.toArtistUserResponse(user);
        } catch (e) {
            await transaction.rollback();
            this.handleError('createArtist', e);
        }
    }

    async updateArtist(id: number, dto: UpdateArtistDto, image: any): Promise<ArtistUserResponse> {
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

    async deleteArtist(id: number): Promise<DeleteArtistResponse> {
        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            const artist = await this.getArtistProfile(user.id, transaction);

            if (artist.is_deleted) {
                throw new HttpException('Артист уже удален', 400);
            }

            await artist.update({
                is_deleted: true,
                deleted_at: new Date(),
            }, { transaction });

            await user.update({
                is_deleted: true,
                deleted_at: new Date(),
            }, { transaction });

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Артист скрыт (мягкое удаление)',
                context: 'ArtistsService.deleteArtist',
                userId: id
            }));

            return {
                success: true,
                message: 'Артист скрыт. Восстановление возможно в течение года.'
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('deleteArtist', e);
        }
    }

    async restoreArtist(id: number): Promise<RestoreArtistResponse> {
        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            const artist = await this.getArtistProfile(user.id, transaction);

            if (!artist.is_deleted) {
                throw new HttpException('Артист не был удален', 400);
            }

            if (artist.deleted_at) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                if (artist.deleted_at < oneYearAgo) {
                    throw new HttpException('Срок восстановления истек (более года)', 410);
                }
            }

            await artist.update({
                is_deleted: false,
                deleted_at: null,
            }, { transaction });

            await user.update({
                is_deleted: false,
                deleted_at: null,
            }, { transaction });

            await transaction.commit();

            return {
                success: true,
                message: 'Артист успешно восстановлен'
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('restoreArtist', e);
        }
    }

    async getArtistById(id: number, lang: string = 'ru'): Promise<ArtistUserResponse | null> {
        this.log('getArtistById', { artistId: id, lang });

        const user = await this.userRepository.findOne({
            where: { id, role: 'artist', is_deleted: false },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            include: [{ model: City, required: true, attributes: ['id', 'name_en', 'name_ru', 'country_id', 'country_code'] },
            { model: Country, required: true, attributes: ['id', 'name_en', 'name_ru', 'iso2', 'iso3'] }]
        });

        if (!user) return null;

        const profile = await this.getArtistProfile(id);
        const stats = await this.getArtistStats(id);
        const moderate = this.parseModerate(profile?.moderate);

        return {
            ...this.toPlainUser(user),
            artistProfile: profile ? {
                ...this.toPlainProfile(profile),
                ...stats,
                moderate,
            } : null,
        };
    }

    async getAll(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<ArtistListResponse> {
        this.log('getAll', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'artist', is_deleted: false },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'city_id', 'country_id'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
            include: [{ model: City, required: true, attributes: ['id', 'name_en', 'name_ru', 'country_id', 'country_code'] },
            { model: Country, required: true, attributes: ['id', 'name_en', 'name_ru', 'iso2', 'iso3'] }]
        });

        if (!rows.length) {
            return {
                data: [],
                pagination: this.buildPagination(0, page, limit)
            };
        }

        const profiles = await this.getArtistProfiles(rows.map(u => u.id));
        const artsMap = await this.getArtsMap(rows.map(u => u.id));

        const data: ArtistListItemResponse[] = rows.map(user => {
            const profile = profiles.get(user.id);

            return {
                ...this.toPlainUser(user),
                artistProfile: profile ? {
                    ...this.toPlainProfile(profile),
                    arts: artsMap.get(user.id) || [],
                } : null,
            };
        });

        return {
            data,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    async getUnmoderatedArtists(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<ArtistListResponse> {
        return this.getArtistsByModerationStatus(false, page, limit, lang);
    }

    async getModeratedArtists(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<ArtistListResponse> {
        this.log('getModeratedArtists', { page, limit, lang });
        const offset = (page - 1) * limit;

        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'artist', is_deleted: false },
            include: [{
                model: ArtistProfile,
                where: {
                    moderate: { [Op.ne]: null, is_deleted: false }
                }
            }],
            limit,
            offset,
            distinct: true,
        });

        const scoredArtists = await Promise.all(
            rows.map(async (user): Promise<ScoredArtistResponse | null> => {
                const profile = user.artistProfile;
                if (!profile) return null;

                let isModerated = false;
                if (profile.moderate) {
                    try {
                        const moderateObj = JSON.parse(profile.moderate);
                        isModerated = moderateObj.moderate === true;
                    } catch {
                        isModerated = false;
                    }
                }

                if (!isModerated) return null;

                const stats = await this.getArtistStats(user.id);
                const totalLikes = stats.totalLikes || 0;
                const artsCount = stats.artsCount || 0;

                const planWeight = profile.getPlanWeight ? profile.getPlanWeight() : 0;
                const isSubscriptionActive = profile.isSubscriptionActive ? profile.isSubscriptionActive() : false;

                const score =
                    totalLikes * 2 +
                    artsCount * 10 +
                    planWeight +
                    (isSubscriptionActive ? 20 : 0);

                return {
                    ...this.toPlainUser(user),
                    artistProfile: {
                        ...this.toPlainProfile(profile),
                        score: Math.round(score * 100) / 100,
                        totalLikes,
                        artsCount,
                        planWeight,
                        isSubscriptionActive
                    }
                };
            })
        );

        const sorted = scoredArtists
            .filter((a): a is ScoredArtistResponse => a !== null)
            .sort((a, b) => (b.artistProfile.score || 0) - (a.artistProfile.score || 0));

        return {
            data: sorted,
            pagination: this.buildPagination(sorted.length, page, limit)
        };
    }

    async getArtsByArtist(artistId: number, lang: string = 'ru'): Promise<Art[]> {
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

        return arts;
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

    async getTopArtists(limit: number = 10, lang: string = 'ru'): Promise<ScoredArtistResponse[]> {
        this.log('getTopArtists', { limit, lang });

        const users = await this.userRepository.findAll({
            where: { role: 'artist', is_deleted: false },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            include: [{
                model: ArtistProfile,
                required: true,
                where: {
                    moderate: { [Op.ne]: null, is_deleted: false }
                }
            }]
        });

        const scoredArtists = await Promise.all(
            users.map(async (user): Promise<ScoredArtistResponse | null> => {
                const profile = user.artistProfile;
                if (!profile) return null;

                let isModerated = false;
                if (profile.moderate) {
                    try {
                        const moderateObj = JSON.parse(profile.moderate);
                        isModerated = moderateObj.moderate === true;
                    } catch {
                        isModerated = false;
                    }
                }

                if (!isModerated) return null;

                const stats = await this.getArtistStats(user.id);
                const totalLikes = stats.totalLikes || 0;
                const artsCount = stats.artsCount || 0;

                const planWeight = profile.getPlanWeight ? profile.getPlanWeight() : 0;
                const isSubscriptionActive = profile.isSubscriptionActive ? profile.isSubscriptionActive() : false;

                const score =
                    totalLikes * 2 +
                    artsCount * 10 +
                    planWeight +
                    (isSubscriptionActive ? 20 : 0);

                return {
                    ...this.toPlainUser(user),
                    artistProfile: {
                        ...this.toPlainProfile(profile),
                        score: Math.round(score * 100) / 100,
                        totalLikes,
                        artsCount,
                        planWeight,
                        isSubscriptionActive
                    }
                };
            })
        );

        const sortedArtists = scoredArtists
            .filter((a): a is ScoredArtistResponse => a !== null)
            .sort((a, b) => (b.artistProfile.score || 0) - (a.artistProfile.score || 0))
            .slice(0, limit);

        return sortedArtists;
    }

    // ==================== PRIVATE METHODS ====================

    private async getArtistsByModerationStatus(
        moderated: boolean,
        page: number,
        limit: number,
        lang: string
    ): Promise<ArtistListResponse> {
        this.log('getArtistsByModerationStatus', { moderated, page, limit, lang });

        const offset = (page - 1) * limit;
        const { rows } = await this.userRepository.findAndCountAll({
            where: { role: 'artist' },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
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

        const data = filtered.map(user => ({
            ...this.toPlainUser(user),
            artistProfile: user.artistProfile ? this.toPlainProfile(user.artistProfile) : null,
        }));

        return {
            data,
            pagination: this.buildPagination(filtered.length, page, limit)
        };
    }

    private async getUser(id: number, transaction?: Transaction): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id }, transaction });
        if (!user) throw new HttpException('Артист не найден', 404);
        return user;
    }

    private async getArtistProfile(userId: number, transaction?: Transaction): Promise<ArtistProfile | null> {
        return this.artistProfileModel.findOne({
            where: { user_id: userId },
            transaction,
        });
    }

    private async getUserWithProfile(id: number): Promise<ArtistUserResponse> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) return null;

        const profile = await this.artistProfileModel.findOne({
            where: { user_id: id },
        });

        return {
            ...this.toPlainUser(user),
            artistProfile: profile ? this.toPlainProfile(profile) : null
        };
    }

    private async checkEmailExists(email: string, transaction?: Transaction): Promise<void> {
        const existing = await this.userRepository.findOne({ where: { email }, transaction });
        if (existing) throw new ConflictException('Пользователь с таким email уже существует');
    }

    private async getArtistStats(artistId: number): Promise<ArtistStatsResponse> {
        const artsCount = await this.artRepository.count({ where: { artist_id: artistId } });
        const arts = await this.artRepository.findAll({
            where: { artist_id: artistId },
            attributes: ['likes']
        });
        const totalLikes = arts.reduce((sum, a) => sum + (a.likes || 0), 0);

        return { artsCount, totalLikes };
    }

    private async getArtistProfiles(userIds: number[]): Promise<Map<number, ArtistProfile>> {
        const profiles = await this.artistProfileModel.findAll({
            where: { user_id: userIds },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });
        return new Map(profiles.map(p => [p.user_id, p]));
    }

    private async getArtsMap(userIds: number[]): Promise<Map<number, any[]>> {
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

    private async buildUserUpdateData(
        dto: UpdateArtistDto,
        image: any,
        user: any
    ): Promise<Partial<User>> {
        const data: any = this.pick(dto, ['email', 'name', 'surname', 'second_name', 'phone_number']);

        if (dto.password) {
            data.password = await this.passwordService.hashPassword(dto.password);
        }

        if (image) {
            data.avatar_path = await this.fileService.createFile(image);
            if (user.avatar_path) {
                await this.fileService.removeFile(user.avatar_path);
            }
        }

        return data;
    }

    private buildProfileUpdateData(dto: UpdateArtistDto): Partial<ArtistProfile> {
        return this.pick(dto, [
            'biography', 'date_birthday', 'likes', 'views', 'profession_id'
        ]);
    }

    private parseModerate(moderate: string): ModerateObject | null {
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

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null) {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as Pick<T, K>);
    }

    // ==================== HELPERS ====================

    private toPlainUser(user: User): any {
        return user.toJSON ? user.toJSON() : user;
    }

    private toPlainProfile(profile: ArtistProfile): any {
        return profile.toJSON ? profile.toJSON() : profile;
    }

    private toArtistUserResponse(user: User): ArtistUserResponse {
        return this.toPlainUser(user);
    }

    private log(method: string, data: any): void {
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