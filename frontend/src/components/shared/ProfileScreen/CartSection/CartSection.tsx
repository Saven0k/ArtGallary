// src/pages/Profile/components/ProfileContent/Cart/Cart.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    clearCart,
    getCart,
    removeFromCart,
    type CartData,
} from '../../../../api/cart/main.api';
import { getArtById } from '../../../../api/arts/main.api';
import { useLanguage } from '../../../../hooks/useLanguage';
import type { Language } from '../../../../context/LanguageContext';
import CartItemRow from './components/CartItemRow/CartItemRow';
import PromoBlock from './components/PromoBlock/PromoBlock';
import TotalsBlock from './components/TotalsBlock/TotalsBlock';
import EmptyCart from './components/EmptyCart/EmptyCart';
import { cartTranslations } from './lang';
import type { ArtPreview, CartLine, CartTotals, PromoCode } from './types';
import {
    PROMO_CODES,
    clampQuantity,
    isOriginalByPrice,
    isPromoCode,
} from './utils';
import './CartSection.scss';

const Cart = () => {
    const { language } = useLanguage();
    const t = cartTranslations[language];

    const [artIds, setArtIds] = useState<number[]>([]);
    const [arts, setArts] = useState<Record<number, ArtPreview>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ---------- load ----------
    const load = useCallback(async () => {
        console.log('[Cart] load() start');

        setLoading(true);
        setError(null);

        const cart: CartData | null = await getCart();
        console.log('[Cart] getCart response:', cart);

        if (!cart) {
            setError(t.errors.loadFailed);
            setLoading(false);
            return;
        }

        setArtIds(cart.artIds);

        const missing = cart.artIds.filter((id) => !arts[id]);
        const fetched = await Promise.all(missing.map((id) => getArtById(id)));

        const next: Record<number, ArtPreview> = { ...arts };
        fetched.forEach((art) => {
            if (!art) return;
            next[art.id] = {
                id: art.id,
                title: art.title,
                imagePath: art.image_path,
                authorName:
                    art.author?.user?.name && art.author?.user?.surname
                        ? `${art.author.user.name} ${art.author.user.surname}`
                        : t.item.unknownAuthor,
                price: Number(art.cost) || 0,
                currency: art.currency ?? 'RUB',
                isOriginal: isOriginalByPrice(Number(art.cost) || 0),
            };
        });
        setArts(next);

        setQuantities((prev) => {
            const copy = { ...prev };
            cart.artIds.forEach((id) => {
                if (copy[id] == null) copy[id] = 1;
            });
            return copy;
        });

        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    useEffect(() => {
        console.log('[Cart] mounted');
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- derived ----------
    const lines: CartLine[] = useMemo(() => {
        return artIds
            .map((id) => {
                const art = arts[id];
                if (!art) return null;
                const quantity = quantities[id] ?? 1;
                return { ...art, quantity, total: art.price * quantity };
            })
            .filter((line): line is CartLine => line !== null);
    }, [artIds, arts, quantities]);

    const totals: CartTotals = useMemo(() => {
        const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
        const percent = appliedPromo ? PROMO_CODES[appliedPromo] : 0;
        const discount = Math.round((subtotal * percent) / 100);
        return {
            subtotal,
            discount,
            total: subtotal - discount,
            currency: lines[0]?.currency ?? 'RUB',
        };
    }, [lines, appliedPromo]);

    // ---------- actions ----------
    const handleQuantity = (id: number, quantity: number) => {
        setQuantities((prev) => ({ ...prev, [id]: clampQuantity(quantity) }));
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
            setError(t.errors.removeFailed);
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
            setError(t.errors.clearFailed);
        }
        setBusy(false);
    };

    const handleApplyPromo = (code: string): string | null => {
        if (!isPromoCode(code)) return t.promo.invalid;
        setAppliedPromo(code);
        return null;
    };

    // ---------- render ----------
    if (loading) {
        return (
            <section className="profile-cart profile-cart--loading">
                {t.loading}
            </section>
        );
    }

    if (lines.length === 0) {
        return <EmptyCart language={language as Language} />;
    }

    return (
        <section className="profile-cart">
            <header className="profile-cart__header">
                <h2 className="profile-cart__title">{t.title}</h2>
                <button
                    type="button"
                    className="profile-cart__clear"
                    onClick={handleClear}
                    disabled={busy}
                >
                    {t.clear}
                </button>
            </header>

            <div className="profile-cart__items">
                {lines.map((line) => (
                    <CartItemRow
                        key={line.id}
                        line={line}
                        busy={busy}
                        language={language as Language}
                        onChangeQuantity={handleQuantity}
                        onRemove={handleRemove}
                    />
                ))}
            </div>

            <PromoBlock
                busy={busy}
                language={language as Language}
                appliedPromo={appliedPromo}
                onApply={handleApplyPromo}
                onRemove={() => setAppliedPromo(null)}
            />

            {error && <div className="profile-cart__error">{error}</div>}

            <TotalsBlock totals={totals} language={language as Language} />

            <button
                type="button"
                className="profile-cart__checkout"
                disabled={busy}
            >
                {t.checkout}
            </button>
        </section>
    );
};

export default Cart;