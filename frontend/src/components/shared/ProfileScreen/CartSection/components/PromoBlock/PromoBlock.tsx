import { useState } from 'react';
import { cartTranslations } from '../../lang';
import type { Language } from '../../../../../../context/LanguageContext';
import type { PromoCode } from '../../types';
import './PromoBlock.scss';

interface PromoBlockProps {
    busy: boolean;
    language: Language;
    appliedPromo: PromoCode | null;
    onApply: (code: string) => string | null;
    onRemove: () => void;
}

const PromoBlock = ({
    busy,
    language,
    appliedPromo,
    onApply,
    onRemove,
}: PromoBlockProps) => {
    const t = cartTranslations[language];
    const [input, setInput] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleApply = () => {
        const code = input.trim().toUpperCase();
        if (!code) return;
        const err = onApply(code);
        if (err) {
            setLocalError(err);
            return;
        }
        setLocalError(null);
        setInput('');
    };

    return (
        <div className="cart-promo">
            <input
                type="text"
                className="cart-promo__input"
                placeholder={t.promo.placeholder}
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    setLocalError(null);
                }}
                disabled={busy}
            />

            <button
                type="button"
                className="cart-promo__apply"
                onClick={handleApply}
                disabled={busy || !input.trim()}
            >
                {t.promo.apply}
            </button>

            {appliedPromo && (
                <span className="cart-promo__applied">
                    {appliedPromo}
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={busy}
                        aria-label={t.promo.remove}
                    >
                        ×
                    </button>
                </span>
            )}

            {localError && (
                <div className="cart-promo__error">{localError}</div>
            )}
        </div>
    );
};

export default PromoBlock;