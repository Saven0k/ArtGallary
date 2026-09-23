// src/site/site-visit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { SiteVisit } from './models/site-visit.model';
import { SiteStatsResponse } from './interfaces/site.interface';
import { SiteRating } from './models/site-rating.model';

@Injectable()
export class SiteVisitService {
    constructor(
        @InjectModel(SiteVisit) private visitModel: typeof SiteVisit,
        @InjectModel(SiteRating) private ratingModel: typeof SiteRating,
    ) {}

    async track(userId: number | null, ip: string | null, ua: string | null, path: string | null) {
        return this.visitModel.create({
            user_id: userId,
            ip,
            user_agent: ua,
            path: path ?? '/',
        });
    }

    async getStats(): Promise<SiteStatsResponse> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - 6); // последние 7 дней включая сегодня
        const startOfMonth = new Date(startOfDay);
        startOfMonth.setDate(startOfMonth.getDate() - 29);

        const [
            totalVisits,
            todayVisits,
            weekVisits,
            monthVisits,
            uniqueUsersRows,
            ratingAgg,
            topPathsRows,
        ] = await Promise.all([
            this.visitModel.count(),
            this.visitModel.count({ where: { created_at: { [Op.gte]: startOfDay } } }),
            this.visitModel.count({ where: { created_at: { [Op.gte]: startOfWeek } } }),
            this.visitModel.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
            this.visitModel.findAll({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('user_id'))), 'cnt'],
                ],
                where: { user_id: { [Op.ne]: null } },
                raw: true,
            }),
            this.ratingModel.findOne({
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('value')), 'avg'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
                ],
                raw: true,
            }),
            this.visitModel.findAll({
                attributes: [
                    'path',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                group: ['path'],
                order: [[Sequelize.literal('count'), 'DESC']],
                limit: 5,
                raw: true,
            }),
        ]);

        const uniqueUsers = Number((uniqueUsersRows[0] as any)?.cnt ?? 0);
        const averageRating = Number((ratingAgg as any)?.avg ?? 0);
        const ratingsCount = Number((ratingAgg as any)?.cnt ?? 0);

        return {
            totalVisits,
            todayVisits,
            weekVisits,
            monthVisits,
            uniqueUsers,
            averageRating: Number(averageRating.toFixed(2)),
            ratingsCount,
            topPaths: (topPathsRows as any[]).map((r) => ({
                path: r.path ?? '/',
                count: Number(r.count),
            })),
        };
    }
}