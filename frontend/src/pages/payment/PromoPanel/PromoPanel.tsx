import "./PromoPanel.scss"


const PromoPanel = () => {
    return (
        <div className="promo">
            <input type="text" placeholder="Промокод" className="promo__input" />
            <button className="promo__button">Применить</button>
        </div>
     );
}

export default PromoPanel;