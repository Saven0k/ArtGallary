import { cartTranslations } from '../../lang';
import type { Language } from '../../../../../../context/LanguageContext';
import { formatPrice, formatDisplayPrice } from '../../utils';
import type { CartTotals } from '../../types';
import './TotalsBlock.scss';

interface TotalsBlockProps {
    totals: CartTotals;
    language: Language;
}

const TotalsBlock = ({ totals, language }: TotalsBlockProps) => {
    const t = cartTranslations[language];
    const display = (value: number) => formatDisplayPrice(value, totals.currency, totals.displayPrice, language);

    return (
        <div className="cart-totals">
            {totals.discount > 0 && (
                <div className="cart-totals__row">
                    <span>{t.totals.subtotal}</span>
                    <span>{display(totals.subtotal)}</span>
                </div>
            )}

            {totals.discount > 0 && (
                <div className="cart-totals__row cart-totals__row--discount">
                    <span>{t.totals.discount}</span>
                    <span>− {display(totals.discount)}</span>
                </div>
            )}

            <div className="cart-totals__row cart-totals__row--final">
                <span>{t.totals.total}</span>
                <span className="cart-totals__final-value">{display(totals.total)}</span>
            </div>

            <p className="cart-totals__note">{t.totals.withoutDelivery}</p>
            {totals.displayPrice && totals.displayPrice.currency !== totals.currency && (
                <p className="cart-totals__note">
                    {t.totals.originalCurrency.replace('{price}', formatPrice(totals.total, totals.currency, language))}
                </p>
            )}
        </div>
    );
};

export default TotalsBlock;
