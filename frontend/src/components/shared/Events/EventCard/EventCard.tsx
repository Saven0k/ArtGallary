// src/components/shared/Events/EventCard/EventCard.tsx
import { Link } from "react-router-dom";
import type { Event } from "../../../../api/events/main.api";
import { useLanguage } from "../../../../hooks/useLanguage";
import "./EventCard.scss";
import { eventCardTranslations } from "./lang";

interface EventCardProps {
    event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
    const { language } = useLanguage();
    const t = eventCardTranslations[language].eventCard;

    const date = new Date(event.created_at).toLocaleDateString(
        language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "zh-CN",
        { day: "2-digit", month: "long", year: "numeric" },
    );

    return (
        <article className="event-card">
            <Link to={`/events/${event.id}`} className="event-card__link">
                <div className="event-card__image-wrap">
                    <img
                        src={event.image}
                        alt={event.title}
                        className="event-card__image"
                        loading="lazy"
                    />
                </div>

                <div className="event-card__body">
                    <span className="event-card__date">{date}</span>
                    <h2 className="event-card__title">{event.title}</h2>
                    <p className="event-card__description">{event.description}</p>
                    <span className="event-card__more">{t.more} →</span>
                </div>
            </Link>
        </article>
    );
};

export default EventCard;