// src/pages/Authors/components/AuthorCard/AuthorCard.tsx
import "./AuthorCard.scss";
import ArrowIcon from "./icons/arrowIcon.svg";
import { Link } from "react-router-dom";
import { authorsTranslations } from "../../lang";
import { useLanguage } from "../../../../../../hooks/useLanguage";
import type { AuthorProfileResponse } from "../../../../../../api/authors/main.api";
import type {Art} from "../../../../../../api/arts/main.api";

export interface AuthorCardProps {
    author: AuthorProfileResponse;
    arts: Art[];
}

const AuthorCard = (data: AuthorCardProps) => {
    const { language } = useLanguage();
    const t = authorsTranslations[language].authorCard;

    return (
        <article className="author-card">
            <div className="author-card__body">
                <img
                    src={data.author.avatar_path || "/default-avatar.png"}
                    alt={data.author.name}
                    className="author-card__avatar"
                />
                <div className="author-card__info">
                    <h2 className="author-card__name">{data.author.surname} {data.author.name}</h2>
                    <p className="author-card__city">{data.author.city?.name_ru}</p>
                    <Link
                        to={`/authors/${data.author.id}`}
                        className="author-card__link"
                    >
                        {t.viewWorks}
                        <img
                            src={ArrowIcon}
                            alt="Перейти"
                            className="author-card__link-icon"
                        />
                    </Link>
                </div>
            </div>
            {data.arts.length > 0 ? (
                <ul className="author-card__arts">
                    {data?.arts?.map((art: any, index: number) => (
                        <li key={index} className="author-card__art">
                            <img
                                src={art.image_path || art.image_pah}
                                alt={art.title}
                                className="author-card__art-image"
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="author-card__empty">{t.empty}</span>
            )}
        </article>
    );
};

export default AuthorCard;