import ArrowLeftIcon from "./icons/arrow.svg";

import './Navigation.scss'

const Navigation = () => {
    return ( 
        <div className="navigation">
            <button className="navigation__button">
                <img src={ArrowLeftIcon} alt="navigation arrow" className="navigation__button-icon" />
            </button>
            {/* TODO: продумать логику на пути, получение по страничке и отображение активной странички в пути, когда мы на ней ( варианты: получение через path сайта, создание тега для самой страничке, на которую мы это вызываем, через пропсы, там ввели и отправили) */}
            <div className="navigation__path">
                <span className="navigation__path-name"></span>
            </div>
        </div>
     );
}
 
export default Navigation;