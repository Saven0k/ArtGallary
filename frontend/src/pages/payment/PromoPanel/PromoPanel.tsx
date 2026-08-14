import "./PromoPanel.scss"

interface PromoPanelProps {
    value: string,
    onChange: (value: string) => void 
}

const PromoPanel = () => {
    return ( 
        <div className="promo">
            <input type="text" placeholder="Промокод" className="promo__input" />
            <button className="promo__button">Применить</button>
        </div>
     );
}
 
export default PromoPanel;