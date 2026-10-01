import { eventsTranslations } from "./lang";
import "./EventsPage.scss";
import { useLanguage } from "../../../hooks/useLanguage";
import EventsList from "../../../components/shared/Events/EventsList/EventsList";

const EventsPage = () => {
    const { language } = useLanguage();
    const t = eventsTranslations[language].eventsPage;

    return (
        <main className="events-page">
            <div className="events-page__container">
                <header className="events-page__header">
                    <h1 className="events-page__title">{t.title}</h1>
                    <p className="events-page__subtitle">{t.subtitle}</p>
                </header>

                <EventsList />
            </div>
        </main>
    );
};

export default EventsPage;