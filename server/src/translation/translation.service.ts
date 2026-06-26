import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TranslationCache } from './translation-cache.model';
import { LanguageDetectionService } from './language-detection.service';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages.config';
import { Op } from 'sequelize';

@Injectable()
export class TranslationService {
    private readonly logger = new Logger(TranslationService.name);
    private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

    constructor(
        @InjectModel(TranslationCache)
        private translationCacheModel: typeof TranslationCache,
        private languageDetectionService: LanguageDetectionService,
    ) { }

    /**
     * Универсальный метод для перевода ОДНОГО объекта
     */
    async translateEntity<T = any>(
        entity: T,
        entityType: string,
        entityId: number,
        targetLanguage: string = DEFAULT_LANGUAGE,
    ): Promise<T> {
        if (!entity) return entity;

        const sourceLanguage = this.languageDetectionService.detectLanguageFromObject(entity);

        if (sourceLanguage === targetLanguage) {
            return this.addInfo(entity, sourceLanguage, targetLanguage, false);
        }

        const cached = await this.translationCacheModel.findOne({
            where: {
                entity_type: entityType,
                entity_id: entityId,
                language_code: targetLanguage,
            },
        });

        if (cached && !this.isExpired(cached)) {
            this.logger.debug(`✅ Cache hit: ${entityType}:${entityId} (${targetLanguage})`);
            const merged = {
                ...entity,
                ...cached.data,
            };
            return this.addInfo(merged, cached.source_language || sourceLanguage, targetLanguage, true);
        }

        this.logger.debug(`🔄 Translating: ${entityType}:${entityId} (${targetLanguage})`);
        const translatedData = await this.translateObject(entity, targetLanguage, sourceLanguage);

        await this.translationCacheModel.upsert({
            entity_type: entityType,
            entity_id: entityId,
            language_code: targetLanguage,
            data: translatedData,
            source_language: sourceLanguage,
            is_machine_translated: true,
            translated_at: new Date(),
            cached_until: new Date(Date.now() + this.CACHE_TTL),
        });

        return this.addInfo(translatedData, sourceLanguage, targetLanguage, false);
    }

    async translateEntities<T = any>(
        entities: T[],
        entityType: string,
        targetLanguage: string = DEFAULT_LANGUAGE,
    ): Promise<T[]> {
        if (!entities || entities.length === 0) return entities;

        // 🔥 ИЗМЕНЕНИЕ: определяем язык для КАЖДОГО объекта
        const result = await Promise.all(
            entities.map(async (entity) => {
                const entityId = (entity as any).id;
                const entityPlain = (entity as any).toJSON ? (entity as any).toJSON() : entity;

                // 🔥 Определяем язык для каждого объекта отдельно
                const sourceLanguage = this.languageDetectionService.detectLanguageFromObject(entityPlain);

                if (sourceLanguage === targetLanguage) {
                    return this.addInfo(entityPlain, sourceLanguage, targetLanguage, false);
                }

                // Проверяем кеш
                const cached = await this.translationCacheModel.findOne({
                    where: {
                        entity_type: entityType,
                        entity_id: entityId,
                        language_code: targetLanguage,
                    },
                });

                if (cached && !this.isExpired(cached)) {
                    const merged = {
                        ...entityPlain,
                        ...cached.data,
                    };
                    return this.addInfo(merged, cached.source_language || sourceLanguage, targetLanguage, true);
                }

                // Переводим
                const translated = await this.translateObject(entityPlain, targetLanguage, sourceLanguage);

                // Сохраняем в кеш
                await this.translationCacheModel.upsert({
                    entity_type: entityType,
                    entity_id: entityId,
                    language_code: targetLanguage,
                    data: translated,
                    source_language: sourceLanguage,
                    is_machine_translated: true,
                    translated_at: new Date(),
                    cached_until: new Date(Date.now() + this.CACHE_TTL),
                });

                return this.addInfo(translated, sourceLanguage, targetLanguage, false);
            })
        );

        return result;
    }
    private async translateObject(obj: any, targetLang: string, sourceLang: string): Promise<any> {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.translateObject(item, targetLang, sourceLang)));
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Пропускаем служебные поля
            if (key.startsWith('_') || key === 'id' || key === 'createdAt' || key === 'updatedAt') {
                result[key] = value;
                continue;
            }

            // 🔥 Переводим только строки, которые содержат текст
            if (typeof value === 'string' && value.trim().length > 0) {
                // Проверяем, не является ли строка уже на целевом языке
                const detectedLang = this.languageDetectionService.detectLanguage(value);
                if (detectedLang === targetLang) {
                    result[key] = value;
                } else {
                    result[key] = await this.translateText(value, targetLang, sourceLang);
                }
            } else if (value && typeof value === 'object') {
                result[key] = await this.translateObject(value, targetLang, sourceLang);
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    /**
     * 🔥 MyMemory API - полностью бесплатный перевод
     */
    async translateText(text: string, targetLang: string, sourceLang: string): Promise<string> {
        if (!text || sourceLang === targetLang) return text;

        console.log('🌐 Translation request (MyMemory):', {
            text,
            from: sourceLang,
            to: targetLang,
        });

        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error('❌ MyMemory API error:', response.status, response.statusText);
                throw new Error(`MyMemory API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData) {
                const translatedText = data.responseData.translatedText;
                console.log('✅ Translation result:', translatedText);
                return translatedText;
            } else {
                console.error('❌ MyMemory translation failed:', data.responseDetails || 'Unknown error');
                throw new Error(data.responseDetails || 'Translation failed');
            }

        } catch (error) {
            console.error('❌ Translation failed:', error);
            this.logger.error(`Translation failed: ${error}`);
            return text;
        }
    }

    /**
     * Фоновый предварительный перевод
     */
    async preTranslateEntity(entity: any, entityType: string, entityId: number): Promise<void> {
        const sourceLang = this.languageDetectionService.detectLanguageFromObject(entity);

        await Promise.allSettled(
            SUPPORTED_LANGUAGES
                .filter(lang => lang !== sourceLang)
                .map(async (lang) => {
                    const existing = await this.translationCacheModel.findOne({
                        where: { entity_type: entityType, entity_id: entityId, language_code: lang },
                    });
                    if (existing) return;

                    const translated = await this.translateObject(entity, lang, sourceLang);
                    await this.translationCacheModel.create({
                        entity_type: entityType,
                        entity_id: entityId,
                        language_code: lang,
                        data: translated,
                        source_language: sourceLang,
                        is_machine_translated: true,
                        translated_at: new Date(),
                        cached_until: new Date(Date.now() + this.CACHE_TTL),
                    });
                    this.logger.log(`✅ Pre-translated ${entityType}:${entityId} to ${lang}`);
                })
        );
    }

    /**
     * Каскадное удаление переводов
     */
    async deleteTranslations(entityType: string, entityId: number): Promise<void> {
        await this.translationCacheModel.destroy({
            where: { entity_type: entityType, entity_id: entityId },
            force: true,
        });
        this.logger.log(`🗑️ Deleted translations for ${entityType}:${entityId}`);
    }

    /**
     * Восстановление переводов
     */
    async restoreTranslations(entityType: string, entityId: number): Promise<void> {
        await this.translationCacheModel.restore({
            where: { entity_type: entityType, entity_id: entityId },
        });
        this.logger.log(`♻️ Restored translations for ${entityType}:${entityId}`);
    }

    /**
     * Очистка просроченного кеша
     */
    async clearExpiredCache(): Promise<number> {
        const count = await this.translationCacheModel.destroy({
            where: {
                cached_until: {
                    [Op.lt]: new Date(), // Используем Op.lt вместо literal
                },
            },
        });
        this.logger.log(`🧹 Cleared ${count} expired cache entries`);
        return count;
    }

    private isExpired(cached: TranslationCache): boolean {
        return cached.cached_until ? new Date() > new Date(cached.cached_until) : false;
    }

    private addInfo(data: any, source: string, target: string, fromCache: boolean): any {
        return {
            ...data,
            _translation: { source, target, fromCache },
        };
    }
}