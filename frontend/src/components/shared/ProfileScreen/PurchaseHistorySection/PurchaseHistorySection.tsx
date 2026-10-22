import { useEffect, useState } from 'react';
import { getCartHistory, type OrderHistoryItem, type OrderStatus } from '../../../../api/cart-history/main.api';
import { usePurchaseHistoryTranslation, type Language } from './lang';
import { formatArtPrice } from '../../../../utils/art-price';
import '../ProfileCommerce.scss';
import './PurchaseHistorySection.scss';

type TabValue = 'all' | OrderStatus;
const STATUS_TONE = { delivered: 'success', in_transit: 'warning', cancelled: 'danger' } as const;

const PurchaseHistory = ({ lang = 'ru' }: { lang?: Language }) => {
    const { t } = usePurchaseHistoryTranslation(lang);
    const [tab, setTab] = useState<TabValue>('all');
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        void getCartHistory(tab === 'all' ? undefined : { status: tab }, controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            setOrders(result?.items ?? []);
            setError(!result);
            setLoading(false);
        });
        return () => controller.abort();
    }, [tab, lang, attempt]);

    const tabs: { value: TabValue; label: string }[] = [
        { value: 'all', label: t('tabs.all') },
        { value: 'delivered', label: t('tabs.delivered') },
        { value: 'in_transit', label: t('tabs.inTransit') },
        { value: 'cancelled', label: t('tabs.cancelled') },
    ];

    return (
        <section className="profile-commerce purchase-history" aria-labelledby="purchase-history-title" aria-busy={loading}>
            <h2 className="profile-commerce__title" id="purchase-history-title">
                {t('title')}
            </h2>
            <div className="purchase-history__tabs" role="group" aria-label={t('filter')}>
                {tabs.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        className={`purchase-history__tab ${tab === item.value ? 'is-active' : ''}`}
                        aria-pressed={tab === item.value}
                        onClick={() => setTab(item.value)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {loading ? (
                <p className="profile-commerce__state" role="status">
                    {t('loading')}
                </p>
            ) : error ? (
                <div className="profile-commerce__state" role="alert">
                    <p>{t('error')}</p>
                    <button type="button" className="profile-commerce__retry" onClick={() => setAttempt((value) => value + 1)}>
                        {t('retry')}
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <p className="profile-commerce__state">{t('empty')}</p>
            ) : (
                <div className="purchase-history__list">
                    {orders.map((order) => (
                        <div className="purchase-history__order" key={order.id}>
                            {order.artIds.map((artId) => {
                                const item = order.items?.find((line) => line.artId === artId);
                                const title = item?.title || t('unknownArtwork');
                                return (
                                    <article className="order-card" key={artId}>
                                        {item?.imagePath ? (
                                            <img className="order-card__image" src={item.imagePath} alt={title} loading="lazy" />
                                        ) : (
                                            <div className="order-card__image order-card__placeholder">{t('noImage')}</div>
                                        )}
                                        <div className="order-card__info">
                                            <h3 className="order-card__title">{title}</h3>
                                            <p className="order-card__author">{item?.authorName || t('unknownAuthor')}</p>
                                            {item?.specifications && (
                                                <p className="order-card__specs">{item.specifications}</p>
                                            )}
                                            {item && item.quantity > 1 && (
                                                <p className="order-card__specs">
                                                    {t('quantity').replace('{count}', String(item.quantity))}
                                                </p>
                                            )}
                                        </div>
                                        <div className="order-card__right">
                                            <span className="order-card__price">
                                                {item?.total != null
                                                    ? formatArtPrice({ cost: item.total, currency: item.currency }, lang)
                                                    : t('unknownPrice')}
                                            </span>
                                            <time className="order-card__date" dateTime={order.createdAt}>
                                                {new Date(order.createdAt).toLocaleDateString(lang, {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </time>
                                            <span
                                                className={`order-card__status order-card__status--${STATUS_TONE[order.status] ?? 'warning'}`}
                                            >
                                                <span className="order-card__status-dot" aria-hidden="true" />
                                                {t(`statuses.${order.status}`)}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                            {order.discount != null && order.discount > 0 && (
                                <p className="purchase-history__order-total">
                                    {t('orderTotal')}: {formatArtPrice({ cost: order.total, currency: order.currency }, lang)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default PurchaseHistory;
