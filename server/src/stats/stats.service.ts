// src/stats/stats.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { AuthorView } from 'src/authors/author-view.model';
import { AuthorProfile } from 'src/authors/author.model';
import { StatsFilterDto } from './dto/stats.dto';
import {
    AuthorStatsResponse,
    ArtStatsResponse,
    GenderStats,
    AgeStats,
    CountryStats,
    TimelineData,
} from './interfaces/stats.interface';

@Injectable()
export class StatsService {
    constructor(
        @InjectModel(AuthorView) private authorViewModel: typeof AuthorView,
        @InjectModel(ArtLike) private artLikeModel: typeof ArtLike,
        @InjectModel(ArtView) private artViewModel: typeof ArtView,
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @InjectModel(Art) private artModel: typeof Art,
    ) {}

    // -------------------- AUTHOR --------------------

    async getAuthorStats(
        authorId: number,
        filter: StatsFilterDto = {},
    ): Promise<AuthorStatsResponse> {
        const author = await this.authorProfileModel.findByPk(authorId);
        if (!author) {
            throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
        }

        const arts = await this.artModel.findAll({
            where: { author_id: authorId },
            attributes: ['id'],
            raw: true,
        });
        const artIds = arts.map((a: any) => a.id);

        const where = this.buildFilter(filter);
        const artWhere = artIds.length ? { ...where, art_id: { [Op.in]: artIds } } : null;

        const [artLikes, artViews, authorViews] = await Promise.all([
            artWhere
                ? this.artLikeModel.findAll({ where: artWhere, raw: true })
                : Promise.resolve([] as any[]),
            artWhere
                ? this.artViewModel.findAll({ where: artWhere, raw: true })
                : Promise.resolve([] as any[]),
            this.authorViewModel.findAll({
                where: { ...where, author_id: authorId },
                raw: true,
            }),
        ]);

        const allViews = [...artViews, ...authorViews];

        return {
            authorId,

            totalLikes: artLikes.length,
            totalViews: allViews.length,

            likesByGender: this.countByGender(artLikes),
            likesByAge: this.countByAge(artLikes),
            likesByCountry: this.countByCountry(artLikes),
            likesTimeline: this.buildTimeline(artLikes),

            viewsByGender: this.countByGender(allViews),
            viewsByAge: this.countByAge(allViews),
            viewsByCountry: this.countByCountry(allViews),
            viewsTimeline: this.buildTimeline(allViews),

            artViews: artViews.length,
            authorViews: authorViews.length,
            uniqueUsers: this.countUniqueUsers([...artLikes, ...allViews]),
        };
    }

    // -------------------- ART --------------------

    async getArtStats(
        artId: number,
        filter: StatsFilterDto = {},
    ): Promise<ArtStatsResponse> {
        const art = await this.artModel.findByPk(artId, {
            attributes: ['id', 'author_id', 'title'],
        });
        if (!art) {
            throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
        }

        const where = this.buildFilter(filter);

        const [likes, views] = await Promise.all([
            this.artLikeModel.findAll({ where: { ...where, art_id: artId }, raw: true }),
            this.artViewModel.findAll({ where: { ...where, art_id: artId }, raw: true }),
        ]);

        return {
            artId,
            authorId: art.author_id,
            title: art.title,

            totalLikes: likes.length,
            totalViews: views.length,

            likesByGender: this.countByGender(likes),
            likesByAge: this.countByAge(likes),
            likesByCountry: this.countByCountry(likes),
            likesTimeline: this.buildTimeline(likes),

            viewsByGender: this.countByGender(views),
            viewsByAge: this.countByAge(views),
            viewsByCountry: this.countByCountry(views),
            viewsTimeline: this.buildTimeline(views),

            uniqueUsers: this.countUniqueUsers([...likes, ...views]),
        };
    }

    /** Для проверки прав в контроллере */
    async getArt(artId: number): Promise<Art | null> {
        return this.artModel.findByPk(artId, {
            attributes: ['id', 'author_id', 'title'],
        });
    }

    // -------------------- helpers --------------------

    private buildFilter(filter: StatsFilterDto): any {
        const where: any = {};

        if (filter.startDate || filter.endDate) {
            where.created_at = {};
            if (filter.startDate) where.created_at[Op.gte] = new Date(filter.startDate);
            if (filter.endDate) where.created_at[Op.lte] = new Date(filter.endDate);
        }
        if (filter.gender) where.user_gender = filter.gender;
        if (filter.ageFrom !== undefined || filter.ageTo !== undefined) {
            where.user_age = {};
            if (filter.ageFrom !== undefined) where.user_age[Op.gte] = filter.ageFrom;
            if (filter.ageTo !== undefined) where.user_age[Op.lte] = filter.ageTo;
        }
        if (filter.cityId) where.city_id = filter.cityId;
        if (filter.countryId) where.country_id = filter.countryId;

        return where;
    }

    private countUniqueUsers(data: any[]): number {
        const set = new Set<number>();
        for (const item of data) {
            if (item.user_id != null) set.add(item.user_id);
        }
        return set.size;
    }

    private countByGender(data: any[]): GenderStats {
        return data.reduce(
            (acc, item) => {
                if (item.user_gender === 'M') acc.male++;
                else if (item.user_gender === 'F') acc.female++;
                else acc.unknown++;
                return acc;
            },
            { male: 0, female: 0, unknown: 0 } as GenderStats,
        );
    }

    private countByAge(data: any[]): AgeStats {
        const result: AgeStats = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };

        for (const item of data) {
            const age = this.resolveAge(item);
            if (age == null) continue;

            if (age >= 18 && age <= 25) result['18-25']++;
            else if (age >= 26 && age <= 35) result['26-35']++;
            else if (age >= 36 && age <= 50) result['36-50']++;
            else if (age > 50) result['50+']++;
        }

        return result;
    }

    private resolveAge(item: any): number | null {
        if (typeof item.user_age === 'number') return item.user_age;
        if (item.user_birthday) {
            const bd = new Date(item.user_birthday);
            const diff = Date.now() - bd.getTime();
            const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
            return age > 0 ? age : null;
        }
        return null;
    }

    private countByCountry(data: any[]): CountryStats[] {
        const map = new Map<number, number>();
        for (const item of data) {
            if (!item.country_id) continue;
            map.set(item.country_id, (map.get(item.country_id) || 0) + 1);
        }

        return Array.from(map.entries())
            .map(([countryId, count]) => ({
                countryId,
                countryName: `Country ${countryId}`,
                count,
            }))
            .sort((a, b) => b.count - a.count);
    }

    private buildTimeline(data: any[]): TimelineData[] {
        const map = new Map<string, number>();
        for (const item of data) {
            if (!item.created_at) continue;
            const date = new Date(item.created_at).toISOString().split('T')[0];
            map.set(date, (map.get(date) || 0) + 1);
        }

        return Array.from(map.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}