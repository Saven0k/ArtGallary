import { cartTranslations } from '../../lang';
import { formatDisplayPrice } from '../../utils';
import type { CartLine } from '../../types';
import './CartItemRow.scss';
import type { Language } from '../../../../../../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface CartItemRowProps {
    line: CartLine;
    busy: boolean;
    language: Language;
    onChangeQuantity: (id: number, quantity: number) => void;
    onRemove: (id: number) => void;
}

const CartItemRow = ({ line, busy, language, onChangeQuantity, onRemove }: CartItemRowProps) => {
    const t = cartTranslations[language];

    return (
        <article className="cart-item">
            <Link to={`/arts/${line.id}`} className="cart-item__picture">
                <img className="cart-item__image" src={line.imagePath} alt={line.title} />
            </Link>

            <div className="cart-item__info">
                <h3 className="cart-item__title">
                    <Link to={`/arts/${line.id}`}>{line.title}</Link>
                </h3>
                <p className="cart-item__author">{line.authorName || t.item.unknownAuthor}</p>
                <p className="cart-item__meta">{line.specifications || (line.isOriginal ? t.item.original : t.item.poster)}</p>
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
                            disabled={busy || line.quantity >= 999}
                            aria-label={t.item.plus}
                        >
                            +
                        </button>
                    </div>
                )}

                <div className="cart-item__price">{formatDisplayPrice(line.total, line.currency, line.displayPrice, language)}</div>

                <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => onRemove(line.id)}
                    disabled={busy}
                    aria-label={t.item.remove}
                >
                    <Trash2 size={20} strokeWidth={1.5} aria-hidden="true" />
                </button>
            </div>
        </article>
    );
};

export default CartItemRow;
