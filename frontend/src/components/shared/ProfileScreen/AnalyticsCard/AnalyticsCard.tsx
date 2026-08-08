// src/pages/Profile/components/AnalyticsCard/AnalyticsCard.tsx
import { BarChart3, Palette, Lightbulb } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { profileTranslations } from "../lang";
import "./AnalyticsCard.scss";

interface AnalyticsCardProps {
    exhibitions: number;
    artworks: number;
    advice?: string;
    onEdit?: () => void;
}

const AnalyticsCard = ({
    exhibitions,
    artworks,
    advice,
    onEdit,
}: AnalyticsCardProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].analytics;

    return (
        <aside className="analytics-card">
            <button
                type="button"
                className="analytics-card__edit"
                onClick={onEdit}
            >
                {t.edit}""
            </button>

            <div className="analytics-card__panel">
                <h3 className="analytics-card__title">{t.title}</h3>

                <div className="analytics-card__stats">
                    <div className="analytics-card__stat">
                        <div className="analytics-card__icon">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <span className="analytics-card__number">{exhibitions}</span>
                            <p className="analytics-card__label">{t.exhibitions}</p>
                        </div>
                    </div>

                    <div className="analytics-card__stat">
                        <div className="analytics-card__icon">
                            <Palette size={18} />
                        </div>
                        <div>
                            <span className="analytics-card__number">{artworks}</span>
                            <p className="analytics-card__label">{t.artworks}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-card__tip">
                <Lightbulb size={18} className="analytics-card__tip-icon" />
                <div>
                    <h4 className="analytics-card__tip-title">{t.tip.title}</h4>
                    <p className="analytics-card__tip-text">
                        {advice || t.tip.default}
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AnalyticsCard;