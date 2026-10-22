import { useState } from 'react';
import { cartTranslations } from '../../lang';
import type { Language } from '../../../../../../context/LanguageContext';
import type { AppliedPromoCode } from '../../../../../../api/promo-codes/main.api';
import './PromoBlock.scss';

interface PromoBlockProps {
    busy: boolean;
    language: Language;
    appliedPromo: AppliedPromoCode | null;
    onApply: (code: string) => Promise<'invalid' | 'failed' | null>;
    onRemove: () => void;
}

const PromoBlock = ({ busy, language, appliedPromo, onApply, onRemove }: PromoBlockProps) => {
    const t = cartTranslations[language];
    const [input, setInput] = useState('');
    const [localError, setLocalError] = useState<'invalid' | 'failed' | null>(null);

    const handleApply = async () => {
        if (busy) return;
        const code = input.trim().toUpperCase();
        if (!code) return;
        const err = await onApply(code);
        if (err) {
            setLocalError(err);
            return;
        }
        setLocalError(null);
        setInput('');
    };

    return (
        <form
            className="cart-promo"
            onSubmit={(event) => {
                event.preventDefault();
                handleApply();
            }}
        >
            <input
                type="text"
                className="cart-promo__input"
                placeholder={t.promo.placeholder}
                aria-label={t.promo.placeholder}
                maxLength={32}
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    setLocalError(null);
                }}
                disabled={busy}
            />

            <button type="submit" className="cart-promo__apply" disabled={busy || !input.trim()}>
                {t.promo.apply}
            </button>

            {appliedPromo && (
                <span className="cart-promo__applied">
                    <span>{appliedPromo.code} · {appliedPromo.percent}%</span>
                    <button type="button" onClick={onRemove} disabled={busy} aria-label={t.promo.remove}>
                        ×
                    </button>
                </span>
            )}

            {localError && (
                <div className="cart-promo__error" role="alert">
                    {t.promo[localError]}
                </div>
            )}
        </form>
    );
};

export default PromoBlock;
