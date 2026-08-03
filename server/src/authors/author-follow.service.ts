// src/authors/author-follow.service.ts
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuthorFollow } from './author-follow.model';
import { AuthorProfile } from './author.model';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Op } from 'sequelize';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/notifications/notification.model';

@Injectable()
export class AuthorFollowService {
    constructor(
        @InjectModel(AuthorFollow) private followModel: typeof AuthorFollow,
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @InjectModel(User) private userModel: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private notificationService: NotificationService,
    ) { }

    async toggleFollow(userId: number, authorId: number) {
        this.log('toggleFollow', { userId, authorId });

        const author = await this.authorProfileModel.findByPk(authorId, {
            include: [{ model: User, attributes: ['id'] }]
        });
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        if (userId === authorId) {
            throw new HttpException('Вы не можете подписаться на себя', HttpStatus.BAD_REQUEST);
        }

        const existingFollow = await this.followModel.findOne({
            where: { user_id: userId, author_id: authorId }
        });

        if (existingFollow) {
            await existingFollow.destroy();
            const followersCount = await this.getFollowersCount(authorId);
            return {
                success: true,
                message: 'Вы отписались от автора',
                is_following: false,
                followers_count: followersCount,
            };
        }

        await this.followModel.create({
            user_id: userId,
            author_id: authorId,
        });

        const user = await this.userModel.findByPk(userId);


        if (author && user) {
            await this.notificationService.createNotification(
                author.user_id,
                NotificationType.NEW_FOLLOWER,
                `${user.name} ${user.surname} подписался на вас`,
                `/authors/${authorId}`,
                authorId,
                { user_id: userId, author_id: authorId }
            );
        }

        const followersCount = await this.getFollowersCount(authorId);
        return {
            success: true,
            message: 'Вы подписались на автора',
            is_following: true,
            followers_count: followersCount,
        };
    }

    async getAuthorFollowers(authorId: number, page: number = 1, limit: number = 20) {
        this.log('getAuthorFollowers', { authorId, page, limit });

        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await this.followModel.findAndCountAll({
            where: { author_id: authorId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'surname', 'avatar_path'],
                },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        return {
            data: rows.map((follow) => ({
                id: follow.user.id,
                name: follow.user.name,
                surname: follow.user.surname,
                avatar_path: follow.user.avatar_path,
                followed_at: follow.created_at,
            })),
            pagination: this.buildPagination(count, page, limit),
        };
    }

    async getUserFollowing(userId: number, page: number = 1, limit: number = 20) {
        this.log('getUserFollowing', { userId, page, limit });

        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await this.followModel.findAndCountAll({
            where: { user_id: userId },
            include: [
                {
                    model: AuthorProfile,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'surname', 'avatar_path'],
                        },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        const data = await Promise.all(
            rows.map(async (follow) => ({
                author_id: follow.author_id,
                author_name: follow.author.user.name,
                author_surname: follow.author.user.surname,
                author_avatar: follow.author.user.avatar_path,
                followers_count: await this.getFollowersCount(follow.author_id),
                followed_at: follow.created_at,
            }))
        );

        return {
            data,
            pagination: this.buildPagination(count, page, limit),
        };
    }

    async checkFollow(userId: number, authorId: number) {
        const follow = await this.followModel.findOne({
            where: { user_id: userId, author_id: authorId }
        });
        return { is_following: !!follow };
    }

    async getFollowersCount(authorId: number) {
        return await this.followModel.count({
            where: { author_id: authorId }
        });
    }

    async getFollowingCount(userId: number) {
        return await this.followModel.count({
            where: { user_id: userId }
        });
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

    private log(method: string, data: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'AuthorFollowService',
            ...data,
        }));
    }
}