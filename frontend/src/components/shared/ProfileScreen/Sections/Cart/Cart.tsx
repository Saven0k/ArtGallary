// src/components/shared/ProfileScreen/Cart/Cart.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    clearCart,
    getCart,
    removeFromCart,
    type CartData,
} from "../../../../../api/cart/main.api";
import { getArtById } from "../../../../../api/arts/main.api"; // ваш существующий метод
import "./Cart.scss";

// ---------------- types ----------------

interface ArtPreview {
    id: number;
    title: string;
    imagePath: string;
    authorName: string;
    price: number;
    currency: string;
    isOriginal: boolean; // на фронте решаем: оригинал = дорогая версия
}

interface CartLine extends ArtPreview {
    quantity: number;
    total: number;
}

// ---------------- promo ----------------

const PROMO_CODES: Record<string, number> = {
    SALE10: 10,
    SALE15: 15,
    ART20: 20,
};

// ---------------- helpers ----------------

const formatPrice = (value: number, currency: string = "RUB"): string => {
    const symbol = currency === "RUB" ? "₽" : currency;
    return `${value.toLocaleString("ru-RU")} ${symbol}`;
};

/** Оригиналом считаем всё, что дороже 5000 ₽ — эвристика для MVP */
const isOriginalByPrice = (price: number): boolean => price > 5000;

// ---------------- row ----------------

const CartItemRow = ({
    line,
    busy,
    onChangeQuantity,
    onRemove,
}: {
    line: CartLine;
    busy: boolean;
    onChangeQuantity: (id: number, quantity: number) => void;
    onRemove: (id: number) => void;
}) => (
    <div className="cart-item">
        <img className="cart-item__image" src={line.imagePath} alt={line.title} />

        <div className="cart-item__info">
            <h4 className="cart-item__title">{line.title}</h4>
            <p className="cart-item__author">{line.authorName}</p>
            <p className="cart-item__meta">
                {line.isOriginal ? "Оригинал" : "Постер"}
            </p>
        </div>

        <div className="cart-item__controls">
            {!line.isOriginal && (
                <div className="cart-item__quantity">
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(line.id, line.quantity - 1)}
                        disabled={busy || line.quantity <= 1}
                        aria-label="Уменьшить"
                    >
                        −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(line.id, line.quantity + 1)}
                        disabled={busy}
                        aria-label="Увеличить"
                    >
                        +
                    </button>
                </div>
            )}

            <div className="cart-item__price">
                {formatPrice(line.total, line.currency)}
            </div>

            <button
                type="button"
                className="cart-item__remove"
                onClick={() => onRemove(line.id)}
                disabled={busy}
                aria-label="Удалить"
            >
                🗑
            </button>
        </div>
    </div>
);

// ---------------- component ----------------

const Cart = () => {
    const [artIds, setArtIds] = useState<number[]>([]);
    const [arts, setArts] = useState<Record<number, ArtPreview>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- загрузка корзины и картин ---
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        const cart: CartData | null = await getCart();
        if (!cart) {
            setError("Не удалось загрузить корзину");
            setLoading(false);
            return;
        }

        setArtIds(cart.artIds);

        // догружаем недостающие картины параллельно
        const missing = cart.artIds.filter((id) => !arts[id]);
        const fetched = await Promise.all(
            missing.map((id) => getArtById(id)),
        );

        const next: Record<number, ArtPreview> = { ...arts };
        fetched.forEach((art) => {
            if (!art) return;
            next[art.id] = {
                id: art.id,
                title: art.title,
                imagePath: art.image_path,
                authorName: art.author?.user?.surname && art.author?.user?.name || "Неизвестный автор",
                price: Number(art.cost) || 0,
                currency: art.currency ?? "RUB",
                isOriginal: isOriginalByPrice(Number(art.cost) || 0),
            };
        });
        setArts(next);

        // инициализируем количество = 1 для новых позиций
        setQuantities((prev) => {
            const copy = { ...prev };
            cart.artIds.forEach((id) => {
                if (copy[id] == null) copy[id] = 1;
            });
            return copy;
        });

        setLoading(false);
    }, [arts]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- сборка строк корзины ---
    const lines: CartLine[] = useMemo(() => {
        return artIds
            .map((id) => {
                const art = arts[id];
                if (!art) return null;
                const quantity = quantities[id] ?? 1;
                return {
                    ...art,
                    quantity,
                    total: art.price * quantity,
                };
            })
            .filter((line): line is CartLine => line !== null);
    }, [artIds, arts, quantities]);

    // --- подсчёт итогов ---
    const totals = useMemo(() => {
        const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
        const percent = appliedPromo ? PROMO_CODES[appliedPromo] ?? 0 : 0;
        const discount = Math.round((subtotal * percent) / 100);
        return {
            subtotal,
            discount,
            total: subtotal - discount,
            currency: lines[0]?.currency ?? "RUB",
        };
    }, [lines, appliedPromo]);

    // --- действия ---
    const handleQuantity = (id: number, quantity: number) => {
        const next = Math.max(1, Math.min(999, Math.floor(quantity)));
        setQuantities((prev) => ({ ...prev, [id]: next }));
    };

    const handleRemove = async (id: number) => {
        setBusy(true);
        setError(null);
        const updated = await removeFromCart(id);
        if (updated) {
            setArtIds(updated.artIds);
            setQuantities((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } else {
            setError("Не удалось удалить позицию");
        }
        setBusy(false);
    };

    const handleClear = async () => {
        setBusy(true);
        setError(null);
        const updated = await clearCart();
        if (updated) {
            setArtIds([]);
            setQuantities({});
            setAppliedPromo(null);
        } else {
            setError("Не удалось очистить корзину");
        }
        setBusy(false);
    };

    const handleApplyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) return;
        if (!(code in PROMO_CODES)) {
            setError("Промокод недействителен");
            return;
        }
        setError(null);
        setAppliedPromo(code);
        setPromoInput("");
    };

    const handleRemovePromo = () => setAppliedPromo(null);

    // --- render ---
    if (loading) {
        return (
            <section className="profile-cart profile-cart--loading">
                Загрузка…
            </section>
        );
    }

    if (lines.length === 0) {
        return (
            <section className="profile-cart profile-cart--empty">
                <h2 className="profile-cart__title">Корзина</h2>
                <p className="profile-cart__empty-text">В корзине пока пусто</p>
            </section>
        );
    }

    return (
        <section className="profile-cart">
            <header className="profile-cart__header">
                <h2 className="profile-cart__title">Корзина</h2>
                <button
                    type="button"
                    className="profile-cart__clear"
                    onClick={handleClear}
                    disabled={busy}
                >
                    Очистить
                </button>
            </header>

            <div className="profile-cart__items">
                {lines.map((line) => (
                    <CartItemRow
                        key={line.id}
                        line={line}
                        busy={busy}
                        onChangeQuantity={handleQuantity}
                        onRemove={handleRemove}
                    />
                ))}
            </div>

            <div className="profile-cart__promo">
                <input
                    type="text"
                    placeholder="Промокод"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    disabled={busy}
                />
                <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={busy || !promoInput.trim()}
                >
                    Применить
                </button>
                {appliedPromo && (
                    <span className="profile-cart__promo-applied">
                        {appliedPromo}
                        <button
                            type="button"
                            onClick={handleRemovePromo}
                            disabled={busy}
                            aria-label="Убрать промокод"
                        >
                            ×
                        </button>
                    </span>
                )}
            </div>

            {error && <div className="profile-cart__error">{error}</div>}

            <div className="profile-cart__totals">
                <div className="profile-cart__totals-row">
                    <span>Итог</span>
                    <span className="profile-cart__totals-total">
                        {formatPrice(totals.total, totals.currency)}
                    </span>
                </div>
                <p className="profile-cart__totals-note">
                    Без учёта доставки
                    {totals.discount > 0 &&
                        ` · Скидка ${formatPrice(totals.discount, totals.currency)}`}
                </p>
            </div>

            <button
                type="button"
                className="profile-cart__checkout"
                disabled={busy}
            >
                Оформить заказ
            </button>
        </section>
    );
};

export default Cart;