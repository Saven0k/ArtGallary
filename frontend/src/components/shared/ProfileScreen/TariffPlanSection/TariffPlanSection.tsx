
import { useState } from 'react';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useLanguage } from '../../../../hooks/useLanguage';
import { tariffPlanTranslations } from './lang';
import './TariffPlanSection.scss';

type PlanKey = 'basic' | 'premium' | 'vip';

const PLAN_LABELS = { free: 'basic', pro: 'premium', vip: 'vip' } as const;

const TariffPlan = () => {
    const { language } = useLanguage();
    const t = tariffPlanTranslations[language].tariffPlan;

    const { subscription, plans, loading, error, message, pendingPayment, purchase, cancel, confirmPayment } = useSubscription();
    const [duration, setDuration] = useState<30 | 90 | 365>(30);
    const [method, setMethod] = useState<'card' | 'qr_code'>('card');
    const currentPlan = subscription?.isActive ? subscription.plan : null;
    const months = duration === 365 ? 12 : duration / 30;
    const priceFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
    const handleChoosePlan = (planKey: PlanKey) => {
        if (planKey === 'basic') { if (subscription?.plan !== 'free') void cancel(); return; }
        void purchase({ plan: planKey === 'premium' ? 'pro' : 'vip', durationDays: duration, paymentMethod: method });
    };

    return (
        <section className="tariff-plan">
            <h1 className="tariff-plan__title">{t.title}</h1>

            {error && <p className="tariff-plan__feedback tariff-plan__feedback--error" role="alert">{error}</p>}
            {message && <p className="tariff-plan__feedback" role="status">{message}</p>}
            {pendingPayment && <button className="tariff-card__btn tariff-plan__confirm" type="button" disabled={loading} onClick={confirmPayment}>{t.checkPayment}</button>}
            {currentPlan && (
                <div className="tariff-plan__current" role="status">
                    <span>{t.currentPlan}: <strong>{t.plans[PLAN_LABELS[currentPlan]].name}</strong></span>
                    {subscription?.expiresAt && <span className="tariff-plan__expires">{t.activeUntil} {new Date(subscription.expiresAt).toLocaleDateString(language)}</span>}
                </div>
            )}
            {plans && (
                <div className="tariff-plan__controls">
                    <label className="tariff-plan__field">
                        <span>{t.durationLabel}</span>
                        <select disabled={loading} value={duration} onChange={(e) => setDuration(Number(e.target.value) as 30 | 90 | 365)}>
                            {([30, 90, 365] as const).map((days) => <option key={days} value={days}>{t.durationOptions[days]}</option>)}
                        </select>
                    </label>
                    <label className="tariff-plan__field">
                        <span>{t.paymentLabel}</span>
                        <select disabled={loading} value={method} onChange={(e) => setMethod(e.target.value as 'card' | 'qr_code')}>
                            {plans.paymentMethods.map((item) => <option key={item.value} value={item.value}>{t.paymentMethods[item.value]}</option>)}
                        </select>
                    </label>
                </div>
            )}
            <div className="tariff-plan__grid">
                {plans?.plans.map((serverPlan) => {
                    const planKey = PLAN_LABELS[serverPlan.name];
                    const plan = t.plans[planKey];
                    const isPremium = planKey === 'premium';
                    const isVip = planKey === 'vip';
                    const isCurrent = currentPlan === serverPlan.name;
                    const totalPrice = serverPlan.durationOptions.find((option) => option.value === duration)?.price ?? serverPlan.price;

                    return (
                        <article
                            key={planKey}
                            className={[
                                'tariff-card',
                                isPremium ? 'tariff-card--premium' : '',
                                isVip ? 'tariff-card--vip' : '',
                                isCurrent ? 'tariff-card--current' : '',
                            ].filter(Boolean).join(' ')}
                        >
                            {isPremium && (
                                <span className="tariff-card__badge">{t.badge}</span>
                            )}

                            <header className="tariff-card__header">
                                <h2 className="tariff-card__name">{plan.name}</h2>
                                <p className="tariff-card__subtitle">{plan.subtitle}</p>

                                <div className="tariff-card__price">
                                    <span className="tariff-card__price-value">{priceFormat.format(totalPrice / months)}</span>
                                    <span className="tariff-card__price-unit">₽</span>
                                    <span className="tariff-card__price-period">{t.perMonth}</span>
                                </div>
                                {duration !== 30 && totalPrice > 0 && <p className="tariff-card__total">{t.totalForPeriod}: {priceFormat.format(totalPrice)} ₽</p>}
                            </header>

                            <ul className="tariff-card__features">
                                {serverPlan.features.map((text, idx) => (
                                    <li
                                        key={idx}
                                        className="tariff-card__feature"
                                    >
                                        <span className="tariff-card__feature-text">{text.replace(/^[^\p{L}\p{N}]+/u, '')}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                className={`tariff-card__btn ${isPremium || isVip ? 'tariff-card__btn--outline' : ''}`}
                                onClick={() => handleChoosePlan(planKey)}
                                disabled={loading || isCurrent || (serverPlan.name !== 'free' && currentPlan !== null && currentPlan !== 'free')}
                            >
                                {isCurrent ? t.currentPlanButton : planKey === 'basic' && currentPlan && currentPlan !== 'free' ? t.cancelRenewal : t.choosePlan}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default TariffPlan;
