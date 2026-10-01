import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { translations } from '../lang';
import { getLatestEvents, type Event as ApiEvent } from '../../../api/events/main.api';
import './Events.scss';

const Events = () => {
    const { language } = useLanguage();
    const t = translations[language].home.events;

    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            const data = await getLatestEvents(4);
            if (cancelled) return;

            if (!data) {
                setError('Не удалось загрузить события');
                setEvents([]);
            } else {
                setEvents(data);
            }
            setLoading(false);
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <section className="events">
            <h2 className="events__title">{t.title}</h2>

            {loading && (
                <p className="events__state">Загрузка...</p>
            )}

            {!loading && error && (
                <p className="events__state events__state--error">{error}</p>
            )}

            {!loading && !error && events.length === 0 && (
                <p className="events__state">Событий пока нет</p>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="events__grid">
                    {events.map((event) => (
                        <article key={event.id} className="events__card">
                            <img
                                src={event.image}
                                alt={event.title}
                                className="events__card-image"
                                loading="lazy"
                            />
                            <h3 className="events__card-title">{event.title}</h3>
                            <p className="events__card-description">{event.description}</p>
                            <Link to={`/events/${event.id}`} className="events__card-all">
                                {t.link}
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Events;