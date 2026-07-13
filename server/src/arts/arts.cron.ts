import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArtsService } from './arts.service';

@Injectable()
export class ArtsCron {
    constructor(private artsService: ArtsService) { }
    @Cron(CronExpression.EVERY_6_HOURS)
    async updateScores() {
        console.log('🔄 Обновление скоров картин...');
        await this.artsService.updateAllScores();
        console.log('✅ Скоры обновлены');
    }
    @Cron('0 3 * * *')
    async refreshFeatured() {
        console.log('🔄 Обновление топа картин...');
        await this.artsService.refreshFeaturedArts();
        console.log('✅ Топ обновлен');
    }
}