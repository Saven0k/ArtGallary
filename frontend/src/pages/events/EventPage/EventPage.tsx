import EventDetails from "../../../components/shared/Events/EventDetails/EventDetails";
import "./EventPage.scss";

const EventPage = () => (
    <main className="event-page">
        <div className="event-page__container">
            <EventDetails />
        </div>
    </main>
);

export default EventPage;