interface ConsultationHeroProps {
    content: {
        eyebrow: string;
        title: string;
        description: string;
        action: string;
    };
}

const ConsultationHero = ({ content }: ConsultationHeroProps) => (
    <section className="art-consultation__hero">
        <div className="art-consultation__hero-copy">
            <p className="art-consultation__eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <p className="art-consultation__hero-description">{content.description}</p>
            <a className="art-consultation__button" href="#consultation-request">{content.action}</a>
        </div>
        <div className="art-consultation__hero-art" aria-hidden="true" />
    </section>
);

export default ConsultationHero;
