import { useLanguage } from '../../../hooks/useLanguage';
import { translations } from '../lang';
import './Events.css';
import {Link} from 'react-router-dom';
import EventImage from "../images/events.png"

interface Event {
    id: number;
    image: string;
    title: string;
    description: string;
}

const eventsData: Event[] = [
    {
        id: 1,
        image: EventImage,
        title: 'Художница Тилинина Маргарита создала новую коллекцию картин',
        description: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность поэтапного и последовательного развития общества. Также как современная методология разработки, в своём классическом представлении, допускает внедрение направлений прогрессивного развития. Наше дело не млащищпш мить птрол рог  Также как современная методология разработки, в своём классическом представлении, допускает внедрение направлений прогрессивного развития. Наше дело не млащищпш мить птрол рог '
    },
    {
        id: 2,
        image: EventImage,
        title: 'Художница Тилинина Маргарита создала новую коллекцию картин',
        description: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность поэтапного и последовательного развития общества. Также как современная методология разработки, в своём классическом представлении, допускает внедрение направлений прогрессивного развития. Наше дело не млащищпш мить птрол рог '
    },
    {
        id: 3,
        image: EventImage,
        title: 'Художница Тилинина Маргарита создала новую коллекцию картин',
        description: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность поэтапного и последовательного развития общества. Также как современная методология разработки, в своём классическом представлении, допускает внедрение направлений прогрессивного развития. Наше дело не млащищпш мить птрол рог '
    },
    {
        id: 4,
        image: EventImage,
        title: 'Художница Тилинина Маргарита создала новую коллекцию картин',
        description: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность поэтапного и последовательного развития общества. Также как современная методология разработки, в своём классическом представлении, допускает внедрение направлений прогрессивного развития. Наше дело не млащищпш мить птрол рог '
    },
];

const Events = () => {
    const { language } = useLanguage();
    const t = translations[language].home.events;

    return (
        <section className="events">
            <h2 className="events__title">{t.title}</h2>
            <div className="events__grid">
                {eventsData.map((event) => (
                    <article key={event.id} className="events__card">
                        <img src={event.image} alt={event.title} className="events__card-image" />
                        <h3 className="events__card-title">{event.title}</h3>
                        <p className="events__card-description">{event.description}</p>
                        <Link to="/" className="events__card-link">
                            {t.button}
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default Events;