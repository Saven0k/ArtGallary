import { useEffect, useState } from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { getEvents, type Event } from "../../../../api/events/main.api";
import { eventsListTranslations } from "./lang";

import "./EventsList.scss";
import EventCard from "../EventCard/EventCard";

const LIMIT = 9;

const EventsList = () => {
    const { language } = useLanguage();
    const t = eventsListTranslations[language].eventsList;

    const [events, setEvents] = useState<Event[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(false);

        getEvents(page, LIMIT).then((res) => {
            if (!alive) return;
            if (!res) {
                setError(true);
            } else {
                setEvents(res.data || []);
                setTotalPages(res.pagination?.totalPages || 1);
            }
            setLoading(false);
        });

        return () => {
            alive = false;
        };
    }, [page]);

    if (loading) {
        return <div className="events-list__state">{t.loading}</div>;
    }

    if (error) {
        return <div className="events-list__state events-list__state--error">{t.error}</div>;
    }

    if (!events.length) {
        return <div className="events-list__state">{t.empty}</div>;
    }

    return (
        <div className="events-list">
            <ul className="events-list__grid">
                {events.map((event) => (
                    <li key={event.id} className="events-list__item">
                        <EventCard event={event} />
                    </li>
                ))}
            </ul>

            {totalPages > 1 && (
                <div className="events-list__pagination">
                    <button
                        type="button"
                        className="events-list__page-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        {t.prev}
                    </button>
                    <span className="events-list__page-info">
                        {page} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className="events-list__page-btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        {t.next}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventsList;