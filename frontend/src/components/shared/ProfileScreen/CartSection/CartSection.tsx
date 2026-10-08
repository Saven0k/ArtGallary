// src/pages/Profile/components/ProfileContent/Cart/Cart.tsx
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../../../../hooks/useCart';
import { checkoutCart } from '../../../../api/cart-history/main.api';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../../../utils/errors';
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

    const { cartItems: artIds, loading: cartLoading, removeFromCart, clearCart, reload } = useCart();
    const navigate = useNavigate();
    const [arts, setArts] = useState<Record<number, ArtPreview>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        Promise.all(artIds.map((id) => getArtById(id, language))).then((fetched) => {
            if (!active) return;
            const next: Record<number, ArtPreview> = {};
            fetched.forEach((art) => {
                if (!art) return;
                next[art.id] = {
                    id: art.id, title: art.title, imagePath: art.image_path,
                    authorName: [art.author?.user?.surname, art.author?.user?.name].filter(Boolean).join(' ') || t.item.unknownAuthor,
                    price: Number(art.cost) || 0, currency: art.currency ?? 'RUB',
                    isOriginal: isOriginalByPrice(Number(art.cost) || 0),
                };
            });
            setArts(next);
            if (fetched.some((art) => !art)) setError(t.errors.loadFailed);
            setLoading(false);
        });
        return () => { active = false; };
    }, [artIds, language, t.errors.loadFailed, t.item.unknownAuthor]);

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

    const mixedCurrencies = new Set(lines.map((line) => line.currency)).size > 1;
    const handleCheckout = async () => {
        if (busy || mixedCurrencies || lines.length !== artIds.length) return;
        setBusy(true);
        setError(null);
        try {
            await checkoutCart({ items: lines.map((line) => ({ artId: line.id, quantity: line.isOriginal ? 1 : line.quantity })), promoCode: appliedPromo ?? undefined });
            await reload();
            navigate('/profile?section=history');
        } catch (e) {
            setError(errorMessage(e, t.errors.loadFailed));
        } finally { setBusy(false); }
    };

    // ---------- render ----------
    if (loading || cartLoading) {
        return (
            <section className="profile-cart profile-cart--loading">
                {t.loading}
            </section>
        );
    }

    if (lines.length === 0 && !error) {
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

            {(error || mixedCurrencies) && <div className="profile-cart__error" role="alert">{error || "Работы в разных валютах нужно оформить отдельно"}</div>}

            <TotalsBlock totals={totals} language={language as Language} />

            <button
                type="button"
                className="profile-cart__checkout"
                onClick={handleCheckout}
                disabled={busy || mixedCurrencies || lines.length !== artIds.length || !lines.length}
            >
                {t.checkout}
            </button>
        </section>
    );
};

export default Cart;