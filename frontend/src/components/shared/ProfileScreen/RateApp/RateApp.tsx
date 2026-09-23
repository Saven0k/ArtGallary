import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getMySiteRating, rateSite } from '../../../../api/site/main.api';
import './RateApp.scss';
import { useLanguage } from '../../../../hooks/useLanguage';
import { rateAppTranslations } from './lang';

const STARS = [1, 2, 3, 4, 5];

const RateApp = () => {
    const { language } = useLanguage();
    const t = rateAppTranslations[language];

    const [rating, setRating] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            const res = await getMySiteRating();
            if (alive && res) setRating(res.value);
        })();
        return () => {
            alive = false;
        };
    }, []);

    const handleRate = async (value: number) => {
        if (saving) return;
        setSaving(true);
        // оптимистично обновляем UI
        const prev = rating;
        setRating(value);
        const res = await rateSite(value);
        if (!res) setRating(prev);
        setSaving(false);
    };

    const displayValue = hovered ?? rating ?? 0;

    return (
        <section className="rate-app">
            <div className="rate-app__info">
                <h3 className="rate-app__title">{t.title}</h3>
                <p className="rate-app__subtitle">{t.subtitle}</p>
            </div>

            <div
                className="rate-app__stars"
                onMouseLeave={() => setHovered(null)}
                aria-label={t.title}
            >
                {STARS.map((star) => {
                    const filled = star <= displayValue;
                    return (
                        <button
                            key={star}
                            type="button"
                            className={`rate-app__star ${filled ? 'is-filled' : ''} ${saving ? 'is-disabled' : ''}`}
                            onMouseEnter={() => setHovered(star)}
                            onClick={() => handleRate(star)}
                            disabled={saving}
                            aria-label={`${star}`}
                        >
                            <Star
                                size={24}
                                strokeWidth={1.6}
                                fill={filled ? 'currentColor' : 'none'}
                            />
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default RateApp;