import {
    ConflictException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

import { User } from '../users/users.model';
import { AuthorProfile } from './author.model';
import { AuthorView } from './author-view.model';
import { AuthorFollow } from './author-follow.model';
import { FilesService } from '../files/files.service';
import { PasswordService } from '../password/password.service';
import { Art } from '../arts/arts.model';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { Profession } from 'src/professions/profession.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';
import { SubscriptionService } from 'src/subscriptions/subscriptions.service';
import { Subscription } from 'src/subscriptions/subscription.model';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/notifications/notification.model';
import { ModerateObject, ModerateResponse } from 'src/types/moderate.types';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { ModerateAuthorDto } from './dto/moderate-author.dto';

export type Gender = 'M' | 'F';

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
    followers_count?: number;
    created_at?: Date;
}

export interface AuthorListItemResponse {
    id: number;
    name: string;
    surname: string;
    second_name?: string;
    role: string;
    gender: Gender;
    avatar_path?: string;
    city?: { id: number; name: string } | null;
    country?: { id: number; name: string; iso2?: string } | null;
    authorProfile: {
        user_id: number;
        biography?: string;
        profession_id?: number;
        profession?: { id: number; name: string } | null;
        avatar_path?: string | null;
        followers_count: number;
        moderate: ModerateObject | null;
        artsCount?: number;
        totalLikes?: number;
        score?: number;
        planWeight?: number;
        isSubscriptionActive?: boolean;
        created_at?: Date;
    } | null;
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

const USER_EXCLUDE = ['password', 'createdAt', 'updatedAt'];
const CITY_ATTRS = ['id', 'name_en', 'name_ru', 'country_id', 'country_code'];
const COUNTRY_ATTRS = ['id', 'name_en', 'name_ru', 'iso2', 'iso3'];
const AUTHOR_PROFILE_ATTRS = [
    'user_id',
    'biography',
    'profession_id',
    'moderate',
    'avatar_path',
    'is_deleted',
    'createdAt',
    'updatedAt',
];

@Injectable()
export class AuthorsService {
    private readonly VIEW_WINDOW_MS = 30 * 60 * 1000;

    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @InjectModel(AuthorView) private authorViewModel: typeof AuthorView,
        @InjectModel(AuthorFollow) private authorFollowModel: typeof AuthorFollow,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectModel(Profession) private professionModel: typeof Profession,
        @InjectConnection() private sequelize: Sequelize,
        private fileService: FilesService,
        private passwordService: PasswordService,
        private subscriptionService: SubscriptionService,
        private notificationService: NotificationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
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

            const [hashedPassword, avatarPath] = await Promise.all([
                this.passwordService.hashPassword(dto.password),
                image ? this.fileService.createFile(image) : Promise.resolve(''),
            ]);

            const user = await this.userRepository.create(
                {
                    email: dto.email,
                    password: hashedPassword,
                    name: dto.name,
                    surname: dto.surname,
                    second_name: dto.second_name || '',
                    date_birthday: dto.date_birthday,
                    gender: dto.gender as Gender,
                    role: 'author',
                    city_id: dto.city_id || null,
                    country_id: dto.country_id || null,
                },
                { transaction },
            );

            await this.authorProfileModel.create(
                {
                    user_id: user.id,
                    biography: dto.biography,
                    profession_id: dto.profession_id,
                    moderate: JSON.stringify({ moderate: false, moderator_id: null, errors: {} }),
                    avatar_path: avatarPath,
                },
                { transaction },
            );

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

            const [userData, avatarPath] = await Promise.all([
                this.buildUserUpdateData(dto),
                image ? this.fileService.createFile(image) : Promise.resolve(undefined),
            ]);

            if (Object.keys(userData).length) {
                await this.userRepository.update(userData, { where: { id: user.id }, transaction });
            }

            const profileData = this.buildProfileUpdateData(dto, avatarPath);
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

            if (author.is_deleted) throw new HttpException('Автор уже удален', 400);

            const now = new Date();
            await author.update({ is_deleted: true, deleted_at: now }, { transaction });
            await user.update({ is_deleted: true, deleted_at: now }, { transaction });

            await transaction.commit();

            this.log('deleteAuthor', { userId: id, message: 'Автор скрыт (мягкое удаление)' });

            return { success: true, message: 'Автор скрыт. Восстановление возможно в течение 5 лет.' };
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

            if (!author.is_deleted) throw new HttpException('Автор не был удален', 400);

            if (author.deleted_at) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                if (author.deleted_at < oneYearAgo) {
                    throw new HttpException('Срок восстановления истек (более года)', 410);
                }
            }

            await author.update({ is_deleted: false, deleted_at: null }, { transaction });
            await user.update({ is_deleted: false, deleted_at: null }, { transaction });

            await transaction.commit();
            return { success: true, message: 'Автор успешно восстановлен' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('restoreAuthor', e);
        }
    }

    async getMyAuthorProfile(id: number, lang: string = 'ru'): Promise<AuthorUserResponse | null> {
        this.log('getAuthorByIdFromOwner', { authorId: id, lang });

        const user = await this.getUser(id);
        if (!user) return null;

        const [author, stats, followersCount] = await Promise.all([
            this.getAuthorProfile(id),
            this.getAuthorStats(id),
            this.authorFollowModel.count({ where: { author_id: id } }),
        ]);

        const subscription = author?.subscription;

        return {
            ...this.toPlainUser(user),
            authorProfile: author
                ? {
                    ...this.toPlainProfile(author),
                    ...stats,
                    moderate: this.parseModerate(author.moderate),
                    plan: subscription?.plan || 'free',
                    planExpiresAt: subscription?.expires_at || null,
                    planStatus: subscription?.is_active || false,
                    planWeight: subscription?.getWeight ? subscription.getWeight() : 0,
                    isSubscriptionActive: subscription?.isActive ? subscription.isActive() : false,
                    followers_count: followersCount,
                    created_at: user.createdAt,
                }
                : null,
        };
    }

    async getAuthorById(id: number, lang: string = 'ru'): Promise<AuthorUserResponse | null> {
        this.log('getAuthorById', { authorId: id, lang });

        const user = await this.getUser(id);
        if (!user) return null;

        const [author, stats, followersCount] = await Promise.all([
            this.getAuthorProfile(id),
            this.getAuthorStats(id),
            this.authorFollowModel.count({ where: { author_id: id } }),
        ]);

        return {
            ...this.toPlainUser(user),
            authorProfile: author
                ? {
                    ...this.toPlainProfile(author),
                    ...stats,
                    moderate: this.parseModerate(author.moderate),
                    followers_count: followersCount,
                    created_at: user.createdAt,
                }
                : null,
        };
    }

    async getAll(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<AuthorListResponse> {
        this.log('getAll', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author', is_deleted: false },
            attributes: ['id', 'name', 'surname', 'second_name', 'role', 'gender', 'city_id', 'country_id'],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
            include: [
                { model: City, required: false, attributes: CITY_ATTRS },
                { model: Country, required: false, attributes: COUNTRY_ATTRS },
            ],
        });

        if (!rows.length) {
            return { data: [], pagination: this.buildPagination(0, page, limit) };
        }

        const userIds = rows.map((u) => u.id);
        const [authors, followersRaw] = await Promise.all([
            this.getAuthorProfiles(userIds),
            this.authorFollowModel.findAll({
                where: { author_id: userIds },
                attributes: ['author_id'],
            }),
        ]);

        const followersMap = followersRaw.reduce((map, row) => {
            map.set(row.author_id, (map.get(row.author_id) || 0) + 1);
            return map;
        }, new Map<number, number>());

        const data: AuthorListItemResponse[] = rows.map((user) =>
            this.formatAuthorListItem(user, authors.get(user.id), followersMap.get(user.id) || 0, lang),
        );

        return { data, pagination: this.buildPagination(count, page, limit) };
    }

    getUnmoderatedAuthors(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getAuthorsByModerationStatus(false, page, limit, lang);
    }

    async getModeratedAuthors(page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<AuthorListResponse> {
        this.log('getModeratedAuthors', { page, limit, lang });

        const offset = (page - 1) * limit;

        const { rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author', is_deleted: false },
            attributes: ['id', 'name', 'surname', 'second_name', 'role', 'gender', 'city_id', 'country_id'],
            include: [
                {
                    model: AuthorProfile,
                    required: true,
                    attributes: AUTHOR_PROFILE_ATTRS,
                    where: { moderate: { [Op.ne]: null }, is_deleted: false },
                    include: [{ model: Profession, attributes: ['id', 'name'] }],
                },
                { model: City, required: false, attributes: CITY_ATTRS },
                { model: Country, required: false, attributes: COUNTRY_ATTRS },
            ],
            limit,
            offset,
            distinct: true,
        });

        const scored = (
            await Promise.all(
                rows
                    .map((user) => this.buildScoredAuthor(user, user.authorProfile))
                    .filter(Boolean),
            )
        ).filter((a): a is AuthorListItemResponse => a !== null);

        scored.sort((a, b) => (b.authorProfile?.score || 0) - (a.authorProfile?.score || 0));

        return { data: scored, pagination: this.buildPagination(scored.length, page, limit) };
    }

    async getArtsByAuthor(authorId: number, lang: string = 'ru'): Promise<Art[]> {
        this.log('getArtsByAuthor', { authorId, lang });

        const author = await this.authorProfileModel.findOne({ where: { user_id: authorId } });
        if (!author) return [];

        return this.artRepository.findAll({
            where: { author_id: author.user_id },
            include: [
                { model: Genre, attributes: ['id', 'title'] },
                { model: Style, attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
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
                { where: { user_id: authorId }, transaction },
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

    async getTopAuthors(limit: number = 10, lang: string = 'ru'): Promise<AuthorListItemResponse[]> {
        this.log('getTopAuthors', { limit, lang });

        const users = await this.userRepository.findAll({
            where: { role: 'author', is_deleted: false },
            attributes: ['id', 'name', 'surname', 'second_name', 'role', 'gender', 'city_id', 'country_id'],
            include: [
                {
                    model: AuthorProfile,
                    required: true,
                    attributes: AUTHOR_PROFILE_ATTRS,
                    where: { moderate: { [Op.ne]: null }, is_deleted: false },
                    include: [{ model: Profession, attributes: ['id', 'name'] }],
                },
                { model: City, required: false, attributes: CITY_ATTRS },
                { model: Country, required: false, attributes: COUNTRY_ATTRS },
            ],
        });

        const scored = (
            await Promise.all(
                users.map((user) => this.buildScoredAuthor(user, user.authorProfile)),
            )
        ).filter((a): a is AuthorListItemResponse => a !== null);

        return scored
            .sort((a, b) => (b.authorProfile?.score || 0) - (a.authorProfile?.score || 0))
            .slice(0, limit);
    }

    async incrementAuthorShares(authorId: number): Promise<{ success: boolean; shares: number }> {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);

        await author.increment('shares', { by: 1 });
        await author.reload();
        this.log('incrementAuthorShares', { authorId, shares: author.shares });
        return { success: true, shares: author.shares };
    }

    async getAuthorShares(authorId: number): Promise<{ shares: number }> {
        const author = await this.authorProfileModel.findByPk(authorId, { attributes: ['shares'] });
        if (!author) throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        return { shares: author.shares };
    }

    async getAuthorFollowersCount(authorId: number): Promise<{ count: number }> {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);

        const count = await this.authorFollowModel.count({ where: { author_id: authorId } });
        return { count };
    }

    async viewAuthor(userId: number | null, authorId: number, req: any) {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);

        const user = userId ? await this.userRepository.findByPk(userId) : null;

        if (userId) {
            const existing = await this.authorViewModel.findOne({
                where: {
                    author_id: authorId,
                    user_id: userId,
                    created_at: { [Op.gte]: new Date(Date.now() - this.VIEW_WINDOW_MS) },
                },
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
            ip_address: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
        });

        await author.increment('views', { by: 1 });
    }

    async getAuthorViewsCount(authorId: number) {
        const count = await this.authorViewModel.count({ where: { author_id: authorId } });
        return { count };
    }

    private async buildScoredAuthor(
        user: User,
        author: AuthorProfile | undefined,
    ): Promise<AuthorListItemResponse | null> {
        if (!author) return null;

        const moderate = this.parseModerate(author.moderate);
        if (!moderate?.moderate) return null;

        const [stats, subscription] = await Promise.all([
            this.getAuthorStats(user.id),
            this.subscriptionService.getActiveSubscription(author.user_id),
        ]);

        const totalLikes = stats.totalLikes || 0;
        const artsCount = stats.artsCount || 0;
        const planWeight = subscription ? subscription.getWeight() : 0;
        const score = totalLikes * 2 + artsCount * 10 + planWeight;

        return this.formatAuthorListItem(user, author, 0, 'ru', {
            score: Math.round(score * 100) / 100,
            totalLikes,
            artsCount,
            planWeight,
            isSubscriptionActive: subscription?.isActive ? subscription.isActive() : false,
        });
    }

    private formatAuthorListItem(
        user: User,
        author: AuthorProfile | undefined,
        followersCount: number,
        lang: string,
        extras?: {
            score?: number;
            totalLikes?: number;
            artsCount?: number;
            planWeight?: number;
            isSubscriptionActive?: boolean;
        },
    ): AuthorListItemResponse {
        const plainUser = this.toPlainUser(user) as any;
        const plainAuthor = author ? this.toPlainProfile(author) : null;
        const nameField = lang === 'ru' ? 'name_ru' : 'name_en';

        return {
            id: plainUser.id,
            name: plainUser.name,
            surname: plainUser.surname,
            second_name: plainUser.second_name,
            role: plainUser.role,
            gender: plainUser.gender,
            city: plainUser.city
                ? { id: plainUser.city.id, name: plainUser.city[nameField] || plainUser.city.name_en }
                : null,
            country: plainUser.country
                ? {
                    id: plainUser.country.id,
                    name: plainUser.country[nameField] || plainUser.country.name_en,
                    iso2: plainUser.country.iso2,
                }
                : null,
            authorProfile: plainAuthor
                ? {
                    user_id: plainAuthor.user_id,
                    biography: plainAuthor.biography,
                    profession_id: plainAuthor.profession_id,
                    profession: plainAuthor.profession
                        ? { id: plainAuthor.profession.id, name: plainAuthor.profession.name }
                        : null,
                    avatar_path: plainAuthor.avatar_path,
                    moderate: this.parseModerate(plainAuthor.moderate),
                    followers_count: followersCount,
                    created_at: plainAuthor.createdAt,
                    ...extras,
                }
                : null,
        };
    }

    private async getAuthorsByModerationStatus(
        moderated: boolean,
        page: number,
        limit: number,
        lang: string,
    ): Promise<AuthorListResponse> {
        this.log('getAuthorsByModerationStatus', { moderated, page, limit, lang });

        const offset = (page - 1) * limit;
        const { rows } = await this.userRepository.findAndCountAll({
            where: { role: 'author' },
            attributes: ['id', 'name', 'surname', 'second_name', 'role', 'gender', 'city_id', 'country_id'],
            include: [
                {
                    model: AuthorProfile,
                    required: true,
                    attributes: AUTHOR_PROFILE_ATTRS,
                    include: [{ model: Profession, attributes: ['id', 'name'] }],
                },
                { model: City, required: false, attributes: CITY_ATTRS },
                { model: Country, required: false, attributes: COUNTRY_ATTRS },
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        const filtered = rows.filter((user) => {
            const parsed = this.parseModerate(user.authorProfile?.moderate);
            return (parsed?.moderate ?? false) === moderated;
        });

        const data = filtered.map((user) =>
            this.formatAuthorListItem(user, user.authorProfile, 0, lang),
        );

        return { data, pagination: this.buildPagination(filtered.length, page, limit) };
    }

    private async getUser(id: number, transaction?: Transaction): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id, role: 'author', is_deleted: false },
            attributes: { exclude: USER_EXCLUDE },
            include: [
                { model: City, required: false, attributes: CITY_ATTRS },
                { model: Country, required: false, attributes: COUNTRY_ATTRS },
                { model: AuthorProfile, include: [{ model: Subscription }] },
            ],
            transaction,
        });
        if (!user) throw new HttpException('Автор не найден', 404);
        return user;
    }

    private getAuthorProfile(userId: number, transaction?: Transaction): Promise<AuthorProfile | null> {
        return this.authorProfileModel.findOne({
            where: { user_id: userId },
            include: [{ model: Subscription }, { model: Profession }],
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
        const arts = await this.artRepository.findAll({
            where: { author_id: authorId },
            attributes: ['likes'],
        });
        const totalLikes = arts.reduce((sum, a) => sum + (a.likes || 0), 0);
        return { artsCount: arts.length, totalLikes };
    }

    private async getAuthorProfiles(userIds: number[]): Promise<Map<number, AuthorProfile>> {
        const profiles = await this.authorProfileModel.findAll({
            where: { user_id: userIds },
            attributes: AUTHOR_PROFILE_ATTRS,
            include: [{ model: Profession, attributes: ['id', 'name'] }],
        });
        return new Map(profiles.map((p) => [p.user_id, p]));
    }

    private async buildUserUpdateData(dto: UpdateAuthorDto): Promise<Partial<User>> {
        const data: any = this.pick(dto, ['email', 'name', 'surname', 'second_name', 'date_birthday', 'city_id', 'country_id']);
        if (dto.password) data.password = await this.passwordService.hashPassword(dto.password);
        return data;
    }

    private buildProfileUpdateData(dto: UpdateAuthorDto, avatarPath?: string): Partial<AuthorProfile> {
        const data: Partial<AuthorProfile> = this.pick(dto, ['biography', 'profession_id']);
        if (avatarPath) data.avatar_path = avatarPath;
        return data;
    }

    private calculateAge(birthday: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const m = today.getMonth() - birthday.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
        return age;
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
            if (obj[key] !== undefined && obj[key] !== null) acc[key] = obj[key];
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
        this.logger.log(
            'info',
            JSON.stringify({ message: `📋 ${method}`, context: 'AuthorsService', ...data }),
        );
    }

    private handleError(method: string, error: any): never {
        this.logger.log(
            'error',
            JSON.stringify({
                message: `❌ Ошибка в ${method}`,
                context: 'AuthorsService',
                error: error.message,
                stack: error.stack,
            }),
        );

        if (error instanceof HttpException || error instanceof ConflictException) throw error;

        throw new HttpException(`Ошибка в ${method}: ${error.message}`, 400);
    }
}