// src/components/shared/ProfileScreen/PurchaseHistory/PurchaseHistory.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
    getCartHistory,
    type OrderHistoryItem,
    type OrderStatus,
} from "../../../../../api/cart-history/main.api";
import { getArtById } from "../../../../../api/arts/main.api";
import {
    usePurchaseHistoryTranslation,
    type Language,
} from "./lang";
import "./PurchaseHistory.scss";

// ---------------- types ----------------

type TabValue = "all" | OrderStatus;

interface ArtPreview {
    id: number;
    title: string;
    imagePath: string;
    authorName: string;
    price: number;
    currency: string;
    specs: string;
}

interface PurchaseHistoryProps {
    lang?: Language;
    userId?: number;
}

// ---------------- helpers ----------------

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "danger"> = {
    delivered: "success",
    in_transit: "warning",
    cancelled: "danger",
};

const LOCALES: Record<Language, string> = {
    ru: "ru-RU",
    en: "en-US",
    zh: "zh-CN",
};

// ---------------- component ----------------

const PurchaseHistory = ({ lang = "ru", userId }: PurchaseHistoryProps) => {
    const { t } = usePurchaseHistoryTranslation(lang);

    const [tab, setTab] = useState<TabValue>("all");
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [arts, setArts] = useState<Record<number, ArtPreview>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const artsRef = useRef<Record<number, ArtPreview>>({});
    useEffect(() => {
        artsRef.current = arts;
    }, [arts]);

    // --- форматирование прямо в компоненте ---

    const formatDate = (iso: string): string => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(LOCALES[lang], {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatPrice = (value: number, currency: string = "RUB"): string => {
        try {
            return new Intl.NumberFormat(LOCALES[lang], {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            }).format(value);
        } catch {
            return `${value.toLocaleString(LOCALES[lang])} ${currency}`;
        }
    };

    const tabs: { value: TabValue; label: string }[] = [
        { value: "all", label: t("tabs.all") },
        { value: "delivered", label: t("tabs.delivered") },
        { value: "in_transit", label: t("tabs.inTransit") },
        { value: "cancelled", label: t("tabs.cancelled") },
    ];

    // --- загрузка ---
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        const filter = tab === "all" ? undefined : { status: tab };
        const res = await getCartHistory(filter);

        if (!res) {
            setError(t("error"));
            setLoading(false);
            return;
        }

        setOrders(res.items);

        const ids = Array.from(new Set(res.items.flatMap((o) => o.artIds)));
        const missing = ids.filter((id) => !artsRef.current[id]);

        const fetched = await Promise.all(missing.map((id) => getArtById(id)));

        if (fetched.length > 0) {
            setArts((prev) => {
                const next = { ...prev };
                fetched.forEach((art) => {
                    if (!art) return;
                    next[art.id] = {
                        id: art.id,
                        title: art.title,
                        imagePath: art.image_path,
                        authorName: art.author?.user?.surname || art.author?.user?.name || "",
                        price: Number(art.cost) || 0,
                        currency: art.currency ?? "RUB",
                        specs: art.specifications ?? "",
                    };
                });
                return next;
            });
        }

        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, lang, userId]);

    useEffect(() => {
        load();
    }, [load]);

    // --- render ---
    if (loading) {
        return (
            <section className="purchase-history purchase-history--loading">
                {t("loading")}
            </section>
        );
    }

    if (error) {
        return (
            <section className="purchase-history purchase-history--error">
                <p>{error}</p>
                <button type="button" onClick={load}>
                    {t("retry")}
                </button>
            </section>
        );
    }

    return (
        <section className="purchase-history">
            <h2 className="purchase-history__title">{t("title")}</h2>

            <div className="purchase-history__tabs">
                {tabs.map((tb) => (
                    <button
                        key={tb.value}
                        type="button"
                        className={`purchase-history__tab ${
                            tab === tb.value ? "is-active" : ""
                        }`}
                        onClick={() => setTab(tb.value)}
                    >
                        {tb.label}
                    </button>
                ))}
            </div>

            {orders.length === 0 ? (
                <p className="purchase-history__empty">{t("empty")}</p>
            ) : (
                <div className="purchase-history__list">
                    {orders.map((order) => (
                        <div className="purchase-history__order" key={order.id}>
                            {order.artIds.map((artId) => {
                                const art = arts[artId];
                                if (!art) return null;

                                return (
                                    <article
                                        className="order-card"
                                        key={`${order.id}-${artId}`}
                                    >
                                        <img
                                            className="order-card__image"
                                            src={art.imagePath}
                                            alt={art.title}
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).alt =
                                                    t("noImage");
                                            }}
                                        />

                                        <div className="order-card__info">
                                            <h4 className="order-card__title">
                                                {art.title}
                                            </h4>
                                            <p className="order-card__author">
                                                {art.authorName}
                                            </p>
                                            {art.specs && (
                                                <p className="order-card__specs">
                                                    {art.specs}
                                                </p>
                                            )}
                                        </div>

                                        <div className="order-card__right">
                                            <div className="order-card__price">
                                                {formatPrice(art.price, art.currency)}
                                            </div>
                                            <div className="order-card__date">
                                                {formatDate(order.createdAt)}
                                            </div>
                                            <div
                                                className={`order-card__status order-card__status--${STATUS_TONE[order.status]}`}
                                            >
                                                <span className="order-card__status-dot" />
                                                {t(`statuses.${order.status}`)}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default PurchaseHistory;