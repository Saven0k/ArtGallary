import { cartTranslations } from '../../lang';
import type { Language } from '../../../../../../context/LanguageContext';
import { formatPrice } from '../../utils';
import type { CartTotals } from '../../types';
import './TotalsBlock.scss';

interface TotalsBlockProps {
    totals: CartTotals;
    language: Language;
}

const TotalsBlock = ({ totals, language }: TotalsBlockProps) => {
    const t = cartTranslations[language];

    return (
        <div className="cart-totals">
            <div className="cart-totals__row">
                <span>{t.totals.subtotal}</span>
                <span>{formatPrice(totals.subtotal, totals.currency)}</span>
            </div>

            {totals.discount > 0 && (
                <div className="cart-totals__row cart-totals__row--discount">
                    <span>{t.totals.discount}</span>
                    <span>
                        − {formatPrice(totals.discount, totals.currency)}
                    </span>
                </div>
            )}

            <div className="cart-totals__row cart-totals__row--final">
                <span>{t.totals.total}</span>
                <span className="cart-totals__final-value">
                    {formatPrice(totals.total, totals.currency)}
                </span>
            </div>

            <p className="cart-totals__note">{t.totals.withoutDelivery}</p>
        </div>
    );
};

export default TotalsBlock;