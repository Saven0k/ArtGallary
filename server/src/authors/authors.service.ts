import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/users.model';
import { AuthorProfile } from './author.model';
import { Op, Sequelize, Transaction } from 'sequelize';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FilesService } from '../files/files.service';
import { PasswordService } from '../password/password.service';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Art } from '../arts/arts.model';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { ModerateObject, ModerateResponse } from 'src/types/moderate.types';
import { Profession } from 'src/professions/profession.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';
import { SubscriptionService } from 'src/subscriptions/subscriptions.service';
import { Subscription } from 'src/subscriptions/subscription.model';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { ModerateAuthorDto } from './dto/moderate-author.dto';
import { AuthorLike } from './author-like.model';
import { AuthorView } from './author-view.model';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/notifications/notification.model';

export type Gender = "M" | "F";
export interface AuthorUserResponse {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number?: string;
    avatar_path?: string;
    role: string;
    gender: Gender;
    date_birthday: Date;
    authorProfile?: AuthorProfileResponse | null;
}

export interface AuthorProfileResponse {
    user_id: number;
    biography: string;
    moderate: ModerateObject | null;
    profession_id: number;
    likes: number;
    views: number;
    is_deleted: boolean;
    deleted_at: Date | null;
    createdAt: Date;
    updatedAt: Date;
    artsCount?: number;
    totalLikes?: number;
    score?: number;
    arts?: any[];

    plan: string;
    planExpiresAt: Date | null;
    planStatus: boolean;
    planWeight: number;
    isSubscriptionActive: boolean;
}

export interface AuthorListItemResponse extends AuthorUserResponse {
    authorProfile?: AuthorProfileResponse & {
        arts?: any[];
    };
}

export interface AuthorListResponse {
    data: AuthorListItemResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface AuthorStatsResponse {
    artsCount: number;
    totalLikes: number;
}

export interface DeleteAuthorResponse {
    success: boolean;
    message: string;
}

export interface RestoreAuthorResponse {
    success: boolean;
    message: string;
}

export interface ScoredAuthorResponse extends AuthorUserResponse {
    author: AuthorProfileResponse & {
        score: number;
        totalLikes: number;
        artsCount: number;
        planWeight: number;
        isSubscriptionActive: boolean;
    };
}

@Injectable()
export class AuthorsService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @InjectModel(AuthorLike) private authorLikeModel: typeof AuthorLike,
        @InjectModel(AuthorView) private authorViewModel: typeof AuthorView,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectModel(Profession) private professionModel: typeof Profession,
        @InjectConnection() private sequelize: Sequelize,
        private fileService: FilesService,
        private passwordService: PasswordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private subscriptionService: SubscriptionService,
        private notificationService: NotificationService,
    ) { }

    async createAuthor(dto: CreateAuthorDto, image: any): Promise<AuthorUserResponse> {
        this.log('createAuthor', { email: dto.email });

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
                date_birthday: dto.date_birthday,
                gender: dto.gender as 'M' | 'F',
                avatar_path: avatarPath,
                role: 'author',
                city_id: dto.city_id || null,
                country_id: dto.country_id || null,
            }, { transaction });

            await this.authorProfileModel.create({
                user_id: user.id,
                biography: dto.biography,
                profession_id: dto.profession_id,
                moderate: JSON.stringify({ moderate: false, moderator_id: null, errors: {} }),
            }, { transaction });

            await transaction.commit();
            return this.toAuthorUserResponse(user);
        } catch (e) {
            await transaction.rollback();
            this.handleError('createAuthor', e);
        }
    }

    async updateAuthor(id: number, dto: UpdateAuthorDto, image: any): Promise<AuthorUserResponse> {
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
                await this.authorProfileModel.update(profileData, { where: { user_id: user.id }, transaction });
            }

            await transaction.commit();
            return this.getAuthorWithProfile(user.id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('updateAuthor', e);
        }
    }

    async deleteAuthor(id: number): Promise<DeleteAuthorResponse> {
        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            const author = await this.getAuthorProfile(user.id, transaction);

            if (author.is_deleted) {
                throw new HttpException('Автор уже удален', 400);
            }

            await author.update({
                is_deleted: true,
                deleted_at: new Date(),
            }, { transaction });

            await user.update({
                is_deleted: true,
                deleted_at: new Date(),
            }, { transaction });

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Автор скрыт (мягкое удаление)',
                context: 'AuthorsService.deleteAuthor',
                userId: id
            }));

            return {
                success: true,
                message: 'Автор скрыт. Восстановление возможно в течение 5 лет.'
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('deleteAuthor', e);
        }
    }

    async restoreAuthor(id: number): Promise<RestoreAuthorResponse> {
        const transaction = await this.sequelize.transaction();
        try {
            const user = await this.getUser(id, transaction);
            const author = await this.getAuthorProfile(user.id, transaction);

            if (!author.is_deleted) {
                throw new HttpException('Автор не был удален', 400);
            }

            if (author.deleted_at) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                if (author.deleted_at < oneYearAgo) {
                    throw new HttpException('Срок восстановления истек (более года)', 410);
                }
            }

            await author.update({
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
                message: 'Автор успешно восстановлен'
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('restoreAuthor', e);
        }
    }

    async getMyAuthorProfile(id: number, lang: string = 'ru'): Promise<AuthorUserResponse | null> {
        this.log('getAuthorByIdFromOwner', { authorId: id, lang });

        const user = await this.getUser(id);
        if (!user) return null;

        const author = await this.getAuthorProfile(id);
        const stats = await this.getAuthorStats(id);
        const moderate = this.parseModerate(author?.moderate);

        const subscription = author?.subscription;
        const plan = subscription?.plan || 'free';
        const planExpiresAt = subscription?.expires_at || null;
        const planStatus = subscription?.is_active || false;
        const planWeight = subscription?.getWeight ? subscription.getWeight() : 0;
        const isSubscriptionActive = subscription?.isActive ? subscription.isActive() : false;

        return {
            ...this.toPlainUser(user),
            authorProfile: author ? {
                ...this.toPlainProfile(author),
                ...stats,
                moderate,

                plan: plan,
                planExpiresAt: planExpiresAt,
                planStatus: planStatus,
                planWeight: planWeight,
                isSubscriptionActive: isSubscriptionActive,
            } : null,
        };
    }

    async getAuthorById(id: number, lang: string = 'ru'): Promise<AuthorUserResponse | null> {
        this.log('getAuthorById', { authorId: id, lang });

        const user = await this.getUser(id);
        if (!user) return null;

        const author = await this.getAuthorProfile(id);
        const stats = await this.getAuthorStats(id);
        const moderate = this.parseModerate(author?.moderate);

        return {
            ...this.toPlainUser(user),
            authorProfile: author ? {
                ...this.toPlainProfile(author),
                ...stats,
                moderate,
            } : null,
        };
    }

    async getAll(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<AuthorListResponse> {
        this.log('getAll', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author', is_deleted: false },
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

        const authors = await this.getAuthorProfiles(rows.map(u => u.id));
        const artsMap = await this.getArtsMap(rows.map(u => u.id));

        const data: AuthorListItemResponse[] = rows.map(user => {
            const author = authors.get(user.id);

            return {
                ...this.toPlainUser(user),
                authorProfile: author ? {
                    ...this.toPlainProfile(author),
                    arts: artsMap.get(user.id) || [],
                } : null,
            };
        });

        return {
            data,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    async getUnmoderatedAuthors(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<AuthorListResponse> {
        return this.getAuthorsByModerationStatus(false, page, limit, lang);
    }

    async getModeratedAuthors(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<AuthorListResponse> {
        this.log('getModeratedAuthors', { page, limit, lang });
        const offset = (page - 1) * limit;

        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author', is_deleted: false },
            include: [{
                model: AuthorProfile,
                where: {
                    moderate: { [Op.ne]: null, is_deleted: false }
                }
            }],
            limit,
            offset,
            distinct: true,
        });

        const scoredAuthors = await Promise.all(
            rows.map(async (user): Promise<ScoredAuthorResponse | null> => {
                const author = user.authorProfile;
                if (!author) return null;

                let isModerated = false;
                if (author.moderate) {
                    try {
                        const moderateObj = JSON.parse(author.moderate);
                        isModerated = moderateObj.moderate === true;
                    } catch {
                        isModerated = false;
                    }
                }

                if (!isModerated) return null;

                const stats = await this.getAuthorStats(user.id);
                const totalLikes = stats.totalLikes || 0;
                const artsCount = stats.artsCount || 0;

                const subscription = await this.subscriptionService.getActiveSubscription(author.id);

                const planWeight = subscription ? subscription.getWeight() : 0;

                const score =
                    totalLikes * 2 +
                    artsCount * 10 +
                    planWeight;

                return {
                    ...this.toPlainUser(user),
                    author: {
                        ...this.toPlainProfile(author),
                        score: Math.round(score * 100) / 100,
                        totalLikes,
                        artsCount,
                        planWeight
                    }
                };
            })
        );

        const sorted = scoredAuthors
            .filter((a): a is ScoredAuthorResponse => a !== null)
            .sort((a, b) => (b.author.score || 0) - (a.author.score || 0));

        return {
            data: sorted,
            pagination: this.buildPagination(sorted.length, page, limit)
        };
    }

    async getArtsByAuthor(authorId: number, lang: string = 'ru'): Promise<Art[]> {
        this.log('getArtsByAuthor', { authorId, lang });

        const author = await this.authorProfileModel.findOne({ where: { user_id: authorId } });
        if (!author) return [];

        let arts = await this.artRepository.findAll({
            where: { author_id: author.user_id },
            include: [
                { model: Genre, attributes: ['id', 'title'] },
                { model: Style, attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        return arts;
    }

    async moderateAuthor(moderateDto: ModerateAuthorDto, authorId: number): Promise<ModerateResponse> {
        this.log('moderateAuthor', { authorId, moderate: moderateDto.moderate });

        const transaction = await this.sequelize.transaction();
        try {
            const author = await this.authorProfileModel.findOne({
                where: { user_id: authorId },
                transaction,
            });

            if (!author) throw new NotFoundException('Профиль автора не найден');

            const moderateObject: ModerateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null,
            };

            const [affected] = await this.authorProfileModel.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { user_id: author.id }, transaction }
            );

            if (!affected) throw new NotFoundException('Профиль автора не найден');

            await transaction.commit();
            return {
                success: true,
                message: moderateDto.moderate ? 'Автор прошел модерацию' : 'Автор отклонен',
                data: moderateObject,
            };
        } catch (e) {
            await transaction.rollback();
            this.handleError('moderateAuthor', e);
        }
    }

    async getTopAuthors(limit: number = 10, lang: string = 'ru'): Promise<ScoredAuthorResponse[]> {
        this.log('getTopAuthors', { limit, lang });

        const users = await this.userRepository.findAll({
            where: { role: 'author', is_deleted: false },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            include: [{
                model: AuthorProfile,
                required: true,
                where: {
                    moderate: { [Op.ne]: null, is_deleted: false }
                }
            }]
        });

        const scoredAuthors = await Promise.all(
            users.map(async (user): Promise<ScoredAuthorResponse | null> => {
                const author = user.authorProfile;
                if (!author) return null;

                let isModerated = false;
                if (author.moderate) {
                    try {
                        const moderateObj = JSON.parse(author.moderate);
                        isModerated = moderateObj.moderate === true;
                    } catch {
                        isModerated = false;
                    }
                }

                if (!isModerated) return null;

                const stats = await this.getAuthorStats(user.id);
                const totalLikes = stats.totalLikes || 0;
                const artsCount = stats.artsCount || 0;

                const subscription = await this.subscriptionService.getActiveSubscription(author.id);

                const planWeight = subscription ? subscription.getWeight() : 0;

                const score =
                    totalLikes * 2 +
                    artsCount * 10 +
                    planWeight;

                return {
                    ...this.toPlainUser(user),
                    author: {
                        ...this.toPlainProfile(author),
                        score: Math.round(score * 100) / 100,
                        totalLikes,
                        artsCount,
                        planWeight
                    }
                };
            })
        );

        const sortedAuthors = scoredAuthors
            .filter((a): a is ScoredAuthorResponse => a !== null)
            .sort((a, b) => (b.author.score || 0) - (a.author.score || 0))
            .slice(0, limit);

        return sortedAuthors;
    }

    private async getAuthorsByModerationStatus(
        moderated: boolean,
        page: number,
        limit: number,
        lang: string
    ): Promise<AuthorListResponse> {
        this.log('getAuthorsByModerationStatus', { moderated, page, limit, lang });

        const offset = (page - 1) * limit;
        const { rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author' },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            include: [{ model: AuthorProfile, required: true }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        const filtered = rows.filter(user => {
            const moderate = user.authorProfile?.moderate;
            if (!moderate) return !moderated;
            try {
                return JSON.parse(moderate).moderate === moderated;
            } catch {
                return !moderated;
            }
        });

        const data = filtered.map(user => ({
            ...this.toPlainUser(user),
            authorProfile: user.authorProfile ? this.toPlainProfile(user.authorProfile) : null,
        }));

        return {
            data,
            pagination: this.buildPagination(filtered.length, page, limit)
        };
    }

    async incrementAuthorShares(authorId: number): Promise<{ success: boolean; shares: number }> {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }
        await author.increment('shares', { by: 1 });
        await author.reload();
        this.log('incrementAuthorShares', { authorId, shares: author.shares });
        return { success: true, shares: author.shares };
    }

    async getAuthorShares(authorId: number): Promise<{ shares: number }> {
        const author = await this.authorProfileModel.findByPk(authorId, {
            attributes: ['shares']
        });
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }
        return { shares: author.shares };
    }

    private async getUser(id: number, transaction?: Transaction): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id, role: 'author', is_deleted: false },
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            include: [{ model: City, required: true, attributes: ['id', 'name_en', 'name_ru', 'country_id', 'country_code'] },
            { model: Country, required: true, attributes: ['id', 'name_en', 'name_ru', 'iso2', 'iso3'] },
            {
                model: AuthorProfile, include: [
                    {
                        model: Subscription,
                        separate: true,
                        limit: 1,
                        order: [['expires_at', 'DESC']]
                    }
                ]
            }],
            transaction
        });
        if (!user) throw new HttpException('Автор не найден', 404);
        return user;
    }

    private async getAuthorProfile(userId: number, transaction?: Transaction): Promise<AuthorProfile | null> {
        return this.authorProfileModel.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: Subscription,
                    separate: true,
                    limit: 1,
                    order: [['expires_at', 'DESC']]
                }
            ],
            transaction,
        });
    }

    private async getAuthorWithProfile(id: number): Promise<AuthorUserResponse> {
        const user = await this.getUser(id);
        if (!user) return null;
        const author = await this.getAuthorProfile(id);
        const subscription = author?.subscription;
        return {
            ...this.toPlainUser(user),
            authorProfile: author ? this.toPlainProfile(author) : null,
            plan: subscription?.plan || 'free',
            planExpiresAt: subscription?.expires_at || null,
            planStatus: subscription?.is_active || false,
            planWeight: subscription?.getWeight ? subscription.getWeight() : 0,
            isSubscriptionActive: subscription?.isActive ? subscription.isActive() : false,
        };
    }

    private async checkEmailExists(email: string, transaction?: Transaction): Promise<void> {
        const existing = await this.userRepository.findOne({ where: { email }, transaction });
        if (existing) throw new ConflictException('Пользователь с таким email уже существует');
    }

    private async getAuthorStats(authorId: number): Promise<AuthorStatsResponse> {
        const artsCount = await this.artRepository.count({ where: { author_id: authorId } });
        const arts = await this.artRepository.findAll({
            where: { author_id: authorId },
            attributes: ['likes']
        });
        const totalLikes = arts.reduce((sum, a) => sum + (a.likes || 0), 0);

        return { artsCount, totalLikes };
    }

    private async getAuthorProfiles(userIds: number[]): Promise<Map<number, AuthorProfile>> {
        const profiles = await this.authorProfileModel.findAll({
            where: { user_id: userIds },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });
        return new Map(profiles.map(p => [p.user_id, p]));
    }

    private async getArtsMap(userIds: number[]): Promise<Map<number, any[]>> {
        const arts = await this.artRepository.findAll({
            where: { author_id: userIds },
            attributes: ['id', 'title', 'image_path', 'likes', 'date_published', 'author_id'],
            limit: 5,
        });

        const map = new Map<number, any[]>();
        arts.forEach(art => {
            const list = map.get(art.author_id) || [];
            list.push(art);
            map.set(art.author_id, list);
        });
        return map;
    }

    async likeAuthor(userId: number, authorId: number) {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        const user = await this.userRepository.findByPk(userId);
        if (!user) {
            throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
        }

        const existing = await this.authorLikeModel.findOne({
            where: { author_id: authorId, user_id: userId }
        });

        if (existing) {
            await existing.destroy();
            await author.decrement('likes', { by: 1 });
            return { success: true, message: 'Лайк удален' };
        }

        await this.authorLikeModel.create({
            author_id: authorId,
            user_id: userId,
            user_gender: user.gender,
            user_birthday: user.date_birthday,
            city_id: user.city_id,
            country_id: user.country_id
        });

        await author.increment('likes', { by: 1 });

        await this.notificationService.createNotification(
            author.user_id,
            NotificationType.AUTHOR_LIKE,
            `${user.name} ${user.surname} оценил ваше творчество`,
            `/authors/${authorId}`,
            authorId,
            { user_id: userId, author_id: authorId }
        );

        return { success: true, message: 'Лайк добавлен' };
    }

    async getAuthorLikes(authorId: number, page: number = 1, limit: number = 20) {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await this.authorLikeModel.findAndCountAll({
            where: { author_id: authorId },
            include: [
                { model: User, attributes: ['id', 'name', 'surname', 'avatar_path', 'gender', 'date_birthday'] },
                { model: City, attributes: ['id', 'name_ru', 'name_en'] },
                { model: Country, attributes: ['id', 'name_ru', 'name_en'] }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        return {
            data: rows.map(row => row.toJSON()),
            total: count,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    async getAuthorLikesCount(authorId: number) {
        const count = await this.authorLikeModel.count({
            where: { author_id: authorId }
        });
        return { count };
    }

    async viewAuthor(userId: number | null, authorId: number, req: any) {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        let user = null;
        if (userId) {
            user = await this.userRepository.findByPk(userId);
        }

        const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];

        if (userId) {
            const existing = await this.authorViewModel.findOne({
                where: {
                    author_id: authorId,
                    user_id: userId,
                    created_at: { [Op.gte]: new Date(Date.now() - 30 * 60 * 1000) }
                }
            });
            if (existing) return;
        }

        await this.authorViewModel.create({
            author_id: authorId,
            user_id: userId || undefined,
            user_gender: user?.gender || null,
            user_age: user?.date_birthday ? this.calculateAge(user.date_birthday) : null,
            city_id: user?.city_id || null,
            country_id: user?.country_id || null,
            ip_address: ip,
        });

        await author.increment('views', { by: 1 });
    }

    private calculateAge(birthday: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const m = today.getMonth() - birthday.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }
        return age;
    }

    async getAuthorViewsCount(authorId: number) {
        const count = await this.authorViewModel.count({
            where: { author_id: authorId }
        });
        return { count };
    }

    private async buildUserUpdateData(
        dto: UpdateAuthorDto,
        image: any,
        user: any
    ): Promise<Partial<User>> {
        const data: any = this.pick(dto, ['email', 'name', 'surname', 'second_name', 'date_birthday', 'city_id', 'country_id']);
        if (dto.password) data.password = await this.passwordService.hashPassword(dto.password);
        if (image) {
            data.avatar_path = await this.fileService.createFile(image);
            if (user.avatar_path) await this.fileService.removeFile(user.avatar_path);
        }

        return data;
    }

    private buildProfileUpdateData(dto: UpdateAuthorDto): Partial<AuthorProfile> {
        return this.pick(dto, [
            'biography', 'profession_id'
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

    private toPlainUser(user: User): any {
        return user.toJSON ? user.toJSON() : user;
    }

    private toPlainProfile(profile: AuthorProfile): any {
        return profile.toJSON ? profile.toJSON() : profile;
    }

    private toAuthorUserResponse(user: User): AuthorUserResponse {
        return this.toPlainUser(user);
    }

    private log(method: string, data: any): void {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'AuthorsService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ Ошибка в ${method}`,
            context: 'AuthorsService',
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
