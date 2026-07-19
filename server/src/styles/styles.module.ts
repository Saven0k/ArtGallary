// src/styles/styles.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';
import { Style } from './styles.model';

@Module({
    imports: [SequelizeModule.forFeature([Style])],
    controllers: [StylesController],
    providers: [StylesService],
    exports: [StylesService],
})
export class StylesModule implements OnModuleInit {
    constructor(private stylesService: StylesService) {}

    async onModuleInit() {
        try {
            const count = await this.stylesService['stylesRepository'].count();
            if (count === 0) {
                console.log('🌱 Стили не найдены, запускаем seed...');
                await this.stylesService.seedStyles();
            } else {
                console.log(`✅ Найдено ${count} стилей`);
            }
        } catch (error) {
            console.error('❌ Ошибка при проверке стилей:', error);
        }
    }
}