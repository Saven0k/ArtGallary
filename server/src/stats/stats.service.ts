// src/stats/stats.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { User } from '../users/users.model';
import { City } from '../location/models/city.model';
import { Country } from '../location/models/country.model';
import { StatsFilterDto } from './dto/stats.dto';
import {
    ArtistStatsResponse,
    StatsResponse,
    GenderStats,
    AgeStats,
    CountryStats,
    TimelineData
} from './interfaces/stats.interface';
import { AuthorLike } from 'src/authors/author-like.model';
import { AuthorView } from 'src/authors/author-view.model';
import { AuthorProfile } from 'src/authors/author.model';

@Injectable()
export class StatsService {
    constructor(
        @InjectModel(AuthorLike) private authorLikeModel: typeof AuthorLike,
        @InjectModel(AuthorView) private authorViewModel: typeof AuthorView,
        @InjectModel(ArtLike) private artLikeModel: typeof ArtLike,
        @InjectModel(ArtView) private artViewModel: typeof ArtView,
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @InjectModel(Art) private artModel: typeof Art,
        @InjectModel(User) private userModel: typeof User,
    ) {}

    async getAuthorDetailedStats(authorId: number, filter: StatsFilterDto): Promise<ArtistStatsResponse> {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        const where = this.buildFilter(filter);

        const [likes, views, recentLikes] = await Promise.all([
            this.authorLikeModel.findAll({ where: { ...where, author_id: authorId } }),
            this.authorViewModel.findAll({ where: { ...where, author_id: authorId } }),
            this.authorLikeModel.findAll({
                where: { author_id: authorId },
                include: [{ model: User, attributes: ['id', 'name', 'surname', 'avatar_path'] }],
                limit: 10,
                order: [['created_at', 'DESC']],
            }),
        ]);

        const stats = this.buildStats(likes, views);

        return {
            ...stats,
            recentLikes: recentLikes.map(like => ({
                id: like.id,
                user: {
                    id: like.user.id,
                    name: like.user.name,
                    surname: like.user.surname,
                    avatar_path: like.user.avatar_path,
                },
                createdAt: like.created_at,
            })),
        };
    }

    async getArtDetailedStats(artId: number, filter: StatsFilterDto): Promise<StatsResponse> {
        const art = await this.artModel.findByPk(artId);
        if (!art) {
            throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
        }

        const where = this.buildFilter(filter);
        const [likes, views] = await Promise.all([
            this.artLikeModel.findAll({ where: { ...where, art_id: artId } }),
            this.artViewModel.findAll({ where: { ...where, art_id: artId } }),
        ]);

        return this.buildStats(likes, views);
    }

    async getArt(artId: number): Promise<Art | null> {
        return this.artModel.findByPk(artId, {
            attributes: ['id', 'author_id', 'title']
        });
    }

    private buildFilter(filter: StatsFilterDto): any {
        const where: any = {};

        if (filter.startDate) {
            where.created_at = { [Op.gte]: new Date(filter.startDate) };
        }
        if (filter.endDate) {
            where.created_at = {
                ...where.created_at,
                [Op.lte]: new Date(filter.endDate)
            };
        }
        if (filter.gender) {
            where.user_gender = filter.gender;
        }
        if (filter.ageFrom !== undefined || filter.ageTo !== undefined) {
            where.user_age = {};
            if (filter.ageFrom !== undefined) {
                where.user_age[Op.gte] = filter.ageFrom;
            }
            if (filter.ageTo !== undefined) {
                where.user_age[Op.lte] = filter.ageTo;
            }
        }
        if (filter.cityId) {
            where.city_id = filter.cityId;
        }
        if (filter.countryId) {
            where.country_id = filter.countryId;
        }

        return where;
    }

    private buildStats(likes: any[], views: any[]): StatsResponse {
        const uniqueUsers = new Set();
        likes.forEach(l => {
            if (l.user_id) uniqueUsers.add(l.user_id);
        });

        return {
            totalLikes: likes.length,
            totalViews: views.length,
            uniqueUsers: uniqueUsers.size,
            likesByGender: this.countByGender(likes),
            viewsByGender: this.countByGender(views),
            likesByAge: this.countByAge(likes),
            viewsByAge: this.countByAge(views),
            likesByCountry: this.countByCountry(likes),
            viewsByCountry: this.countByCountry(views),
            likesTimeline: this.buildTimeline(likes),
            viewsTimeline: this.buildTimeline(views),
        };
    }

    private countByGender(data: any[]): GenderStats {
        return data.reduce(
            (acc, item) => {
                if (item.user_gender === 'M') acc.male++;
                else if (item.user_gender === 'F') acc.female++;
                else acc.unknown++;
                return acc;
            },
            { male: 0, female: 0, unknown: 0 }
        );
    }

    private countByAge(data: any[]): AgeStats {
        const result = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };

        data.forEach(item => {
            const age = item.user_age;
            if (!age) return;

            if (age >= 18 && age <= 25) result['18-25']++;
            else if (age >= 26 && age <= 35) result['26-35']++;
            else if (age >= 36 && age <= 50) result['36-50']++;
            else if (age > 50) result['50+']++;
        });

        return result;
    }

    private countByCountry(data: any[]): CountryStats[] {
        const map = new Map<number, { countryId: number; count: number }>();

        data.forEach(item => {
            if (item.country_id) {
                const existing = map.get(item.country_id);
                if (existing) {
                    existing.count++;
                } else {
                    map.set(item.country_id, {
                        countryId: item.country_id,
                        count: 1,
                    });
                }
            }
        });

        return Array.from(map.values())
            .map(item => ({
                ...item,
                countryName: `Country ${item.countryId}`,
            }))
            .sort((a, b) => b.count - a.count);
    }

    private buildTimeline(data: any[]): TimelineData[] {
        const map = new Map<string, number>();

        data.forEach(item => {
            const date = item.created_at.toISOString().split('T')[0];
            map.set(date, (map.get(date) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}