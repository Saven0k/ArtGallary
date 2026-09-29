import { cartTranslations } from '../../lang';
import { formatPrice } from '../../utils';
import type { CartLine } from '../../types';
import './CartItemRow.scss';
import type { Language } from '../../../../../../context/LanguageContext';

interface CartItemRowProps {
    line: CartLine;
    busy: boolean;
    language: Language;
    onChangeQuantity: (id: number, quantity: number) => void;
    onRemove: (id: number) => void;
}

const CartItemRow = ({
    line,
    busy,
    language,
    onChangeQuantity,
    onRemove,
}: CartItemRowProps) => {
    const t = cartTranslations[language];

    return (
        <div className="cart-item">
            <img className="cart-item__image" src={line.imagePath} alt={line.title} />

            <div className="cart-item__info">
                <h4 className="cart-item__title">{line.title}</h4>
                <p className="cart-item__author">
                    {line.authorName || t.item.unknownAuthor}
                </p>
                <p className="cart-item__meta">
                    {line.isOriginal ? t.item.original : t.item.poster}
                </p>
            </div>

            <div className="cart-item__controls">
                {!line.isOriginal && (
                    <div className="cart-item__quantity">
                        <button
                            type="button"
                            onClick={() => onChangeQuantity(line.id, line.quantity - 1)}
                            disabled={busy || line.quantity <= 1}
                            aria-label={t.item.minus}
                        >
                            −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                            type="button"
                            onClick={() => onChangeQuantity(line.id, line.quantity + 1)}
                            disabled={busy}
                            aria-label={t.item.plus}
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
                    aria-label={t.item.remove}
                >
                    🗑
                </button>
            </div>
        </div>
    );
};

export default CartItemRow;