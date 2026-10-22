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
import type { ArtPreview, CartLine, CartTotals } from './types';
import { clampQuantity, isOriginalByPrice } from './utils';
import { validatePromoCode, PromoCodeError, type AppliedPromoCode } from '../../../../api/promo-codes/main.api';
import './CartSection.scss';
import '../ProfileCommerce.scss';

const Cart = () => {
    const { language } = useLanguage();
    const t = cartTranslations[language];

    const { cartItems: artIds, loading: cartLoading, removeFromCart, clearCart, reload } = useCart();
    const navigate = useNavigate();
    const [arts, setArts] = useState<Record<number, ArtPreview>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromoCode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

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
                    id: art.id,
                    title: art.title,
                    imagePath: art.image_path,
                    authorName: [art.author?.user?.surname, art.author?.user?.name].filter(Boolean).join(' ') || t.item.unknownAuthor,
                    specifications: art.specifications ?? '',
                    price: Math.round((Number(art.cost) || 0) * 100) / 100,
                    currency: art.currency ?? 'RUB',
                    displayPrice: art.display_price,
                    isOriginal: isOriginalByPrice(Number(art.cost) || 0),
                };
            });
            setArts(next);
            if (fetched.some((art) => !art)) setError(t.errors.loadFailed);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [artIds, language, t.errors.loadFailed, t.item.unknownAuthor, attempt]);

    const lines: CartLine[] = useMemo(() => {
        return artIds
            .map((id) => {
                const art = arts[id];
                if (!art) return null;
                const quantity = quantities[id] ?? 1;
                return { ...art, quantity, total: Math.round(art.price * quantity * 100) / 100 };
            })
            .filter((line): line is CartLine => line !== null);
    }, [artIds, arts, quantities]);

    const totals: CartTotals = useMemo(() => {
        const subtotal = Math.round(lines.reduce((sum, l) => sum + l.total, 0) * 100) / 100;
        const percent = appliedPromo?.percent ?? 0;
        const discount = Math.round(subtotal * percent) / 100;
        return {
            subtotal,
            discount,
            total: Math.round((subtotal - discount) * 100) / 100,
            currency: lines[0]?.currency ?? 'RUB',
            displayPrice: lines[0]?.displayPrice,
        };
    }, [lines, appliedPromo]);

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

    const handleApplyPromo = async (code: string): Promise<'invalid' | 'failed' | null> => {
        if (busy) return null;
        setBusy(true);
        setError(null);
        try {
            setAppliedPromo(await validatePromoCode(code));
            return null;
        } catch (error) {
            return error instanceof PromoCodeError && error.status === 400 ? 'invalid' : 'failed';
        } finally {
            setBusy(false);
        }
    };

    const mixedCurrencies = new Set(lines.map((line) => line.currency)).size > 1;
    const handleCheckout = async () => {
        if (busy || mixedCurrencies || lines.length !== artIds.length) return;
        setBusy(true);
        setError(null);
        try {
            await checkoutCart({
                items: lines.map((line) => ({ artId: line.id, quantity: line.isOriginal ? 1 : line.quantity })),
                promoCode: appliedPromo?.code,
            });
            await reload();
            navigate('/profile?section=history');
        } catch (e) {
            if (e instanceof Error && e.message === 'PROMO_CODE_INVALID') {
                setAppliedPromo(null);
                setError(t.promo.invalid);
            } else setError(errorMessage(e, t.errors.checkoutFailed));
        } finally {
            setBusy(false);
        }
    };

    if (loading || cartLoading) {
        return (
            <section className="profile-commerce profile-cart" aria-busy="true">
                <h2 className="profile-commerce__title">{t.title}</h2>
                <p className="profile-commerce__state" role="status">
                    {t.loading}
                </p>
            </section>
        );
    }

    if (lines.length === 0 && !error) {
        return <EmptyCart language={language as Language} />;
    }

    return (
        <section className="profile-commerce profile-cart" aria-labelledby="cart-title">
            <header className="profile-commerce__header">
                <h2 className="profile-commerce__title" id="cart-title">
                    {t.title}
                </h2>
                <button type="button" className="profile-cart__clear" onClick={handleClear} disabled={busy}>
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

            {lines.length > 0 && (
                <PromoBlock
                    busy={busy}
                    language={language as Language}
                    appliedPromo={appliedPromo}
                    onApply={handleApplyPromo}
                    onRemove={() => setAppliedPromo(null)}
                />
            )}

            {(error || mixedCurrencies) && (
                <div className="profile-cart__error" role="alert">
                    {error || t.errors.mixedCurrencies}
                    {lines.length !== artIds.length && (
                        <button type="button" className="profile-commerce__retry" onClick={() => setAttempt((value) => value + 1)}>
                            {t.retry}
                        </button>
                    )}
                </div>
            )}

            {!mixedCurrencies && lines.length > 0 && <TotalsBlock totals={totals} language={language as Language} />}

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
