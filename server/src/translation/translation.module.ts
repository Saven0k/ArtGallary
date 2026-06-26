import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TranslationService } from './translation.service';
import { TranslationCache } from './translation-cache.model';
import { LanguageDetectionService } from './language-detection.service';

@Global()
@Module({
    imports: [SequelizeModule.forFeature([TranslationCache])],
    providers: [TranslationService, LanguageDetectionService],
    exports: [TranslationService],
})
export class TranslationModule {}