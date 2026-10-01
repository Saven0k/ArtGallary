// src/components/shared/Events/EventDetails/EventDetails.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEventById, type Event } from "../../../../api/events/main.api";
import { useLanguage } from "../../../../hooks/useLanguage";
import "./EventDetails.scss";
import { eventDetailsTranslations } from "./lang";

const EventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { language } = useLanguage();
    const t = eventDetailsTranslations[language].eventDetails;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        setLoading(true);
        getEventById(Number(id)).then((res) => {
            if (alive) {
                setEvent(res);
                setLoading(false);
            }
        });
        return () => {
            alive = false;
        };
    }, [id]);

    if (loading) {
        return <div className="event-details__state">{t.loading}</div>;
    }

    if (!event) {
        return (
            <div className="event-details__state event-details__state--error">
                <p>{t.notFound}</p>
                <Link to="/events" className="event-details__back">
                    {t.backToEvents}
                </Link>
            </div>
        );
    }

    const date = new Date(event.created_at).toLocaleDateString(
        language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "zh-CN",
        { day: "2-digit", month: "long", year: "numeric" },
    );

    return (
        <article className="event-details">
            <Link to="/events" className="event-details__back">
                ← {t.backToEvents}
            </Link>

            <header className="event-details__header">
                <span className="event-details__date">{date}</span>
                <h1 className="event-details__title">{event.title}</h1>
            </header>

            <div className="event-details__image-wrap">
                <img
                    src={event.image}
                    alt={event.title}
                    className="event-details__image"
                />
            </div>

            <div className="event-details__body">
                <p className="event-details__description">{event.description}</p>
            </div>
        </article>
    );
};

export default EventDetails;