// src/site/site-rating.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SiteRating } from './models/site-rating.model';

@Injectable()
export class SiteRatingService {
    constructor(
        @InjectModel(SiteRating) private ratingModel: typeof SiteRating,
    ) {}

    /** Upsert: одна оценка на пользователя, повторный клик обновляет */
    async rate(userId: number, value: number): Promise<{ value: number }> {
        const existing = await this.ratingModel.findOne({ where: { user_id: userId } });

        if (existing) {
            existing.value = value;
            await existing.save();
            return { value: existing.value };
        }

        const created = await this.ratingModel.create({ user_id: userId, value });
        return { value: created.value };
    }

    async getMyRating(userId: number): Promise<{ value: number | null }> {
        const row = await this.ratingModel.findOne({ where: { user_id: userId } });
        return { value: row?.value ?? null };
    }
}