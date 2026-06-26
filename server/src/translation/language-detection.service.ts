import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LanguageDetectionService {
    private readonly logger = new Logger(LanguageDetectionService.name);

    detectLanguage(text: string): string {
        if (!text || text.trim().length === 0) return 'unknown';

        const sample = text.trim();

        // 🔥 Китайский (должен быть первым)
        if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';

        // Русский
        if (/[\u0400-\u04FF]/.test(sample)) return 'ru';

        // Немецкий
        if (/[äöüß]/i.test(sample)) return 'de';

        // Французский
        if (/[éèêëàâôûùçïî]/i.test(sample)) return 'fr';

        // Английский (латиница)
        if (/^[a-zA-Z0-9\s.,!?'"()-]/.test(sample)) return 'en';

        return 'unknown';
    }

    detectLanguageFromObject(obj: any): string {
        if (!obj || typeof obj !== 'object') return 'unknown';

        const texts: string[] = [];
        const collect = (value: any) => {
            if (typeof value === 'string' && value.trim().length > 0) {
                texts.push(value);
            } else if (value && typeof value === 'object') {
                Object.values(value).forEach(v => collect(v));
            }
        };
        collect(obj);

        if (texts.length === 0) return 'unknown';

        const counts: Record<string, number> = {};
        for (const text of texts) {
            const lang = this.detectLanguage(text);
            if (lang !== 'unknown') counts[lang] = (counts[lang] || 0) + 1;
        }

        let maxCount = 0;
        let result = 'unknown';
        for (const [lang, count] of Object.entries(counts)) {
            if (count > maxCount) { maxCount = count; result = lang; }
        }
        return result;
    }
}