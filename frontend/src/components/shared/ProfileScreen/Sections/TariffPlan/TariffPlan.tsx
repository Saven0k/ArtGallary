// src/components/TariffPlan/TariffPlan.tsx
import { useLanguage } from '../../../../../hooks/useLanguage';
import { tariffPlanTranslations } from './lang';
import './TariffPlan.scss';

type PlanKey = 'basic' | 'premium' | 'vip';

const PLAN_ORDER: PlanKey[] = ['basic', 'premium', 'vip'];

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8.5L6.5 12L13 4.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 4L12 12M12 4L4 12" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const TariffPlan = () => {
    const { language } = useLanguage();
    const t = tariffPlanTranslations[language].tariffPlan;

    const handleChoosePlan = (planKey: PlanKey) => {
        // TODO: navigate(`/checkout/${planKey}`);
        console.log('selected plan:', planKey);
    };

    return (
        <section className="tariff-plan">
            <h1 className="tariff-plan__title">{t.title}</h1>

            <div className="tariff-plan__grid">
                {PLAN_ORDER.map((planKey) => {
                    const plan = t.plans[planKey];
                    const isPremium = planKey === 'premium';
                    const isVip = planKey === 'vip';

                    return (
                        <article
                            key={planKey}
                            className={[
                                'tariff-card',
                                isPremium ? 'tariff-card--premium' : '',
                                isVip ? 'tariff-card--vip' : '',
                            ].filter(Boolean).join(' ')}
                        >
                            {isPremium && (
                                <span className="tariff-card__badge">{t.badge}</span>
                            )}

                            <header className="tariff-card__header">
                                <h2 className="tariff-card__name">{plan.name}</h2>
                                <p className="tariff-card__subtitle">{plan.subtitle}</p>

                                <div className="tariff-card__price">
                                    <span className="tariff-card__price-value">{plan.price}</span>
                                    <span className="tariff-card__price-unit">₽</span>
                                    <span className="tariff-card__price-period">{t.perMonth}</span>
                                </div>
                            </header>

                            <ul className="tariff-card__features">
                                {plan.features.map((feature, idx) => (
                                    <li
                                        key={idx}
                                        className={`tariff-card__feature ${feature.included ? '' : 'tariff-card__feature--excluded'}`}
                                    >
                                        <span className="tariff-card__feature-icon">
                                            {feature.included ? <CheckIcon /> : <CrossIcon />}
                                        </span>
                                        <span className="tariff-card__feature-text">{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                className={`tariff-card__btn ${isPremium || isVip ? 'tariff-card__btn--outline' : ''}`}
                                onClick={() => handleChoosePlan(planKey)}
                            >
                                {t.choosePlan}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default TariffPlan;