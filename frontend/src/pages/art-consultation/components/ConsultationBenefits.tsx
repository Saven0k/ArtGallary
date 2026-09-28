interface ConsultationBenefitsProps {
    content: {
        title: string;
        items: ReadonlyArray<{ icon: string; title: string; text: string }>;
    };
}

const ConsultationBenefits = ({ content }: ConsultationBenefitsProps) => (
    <section className="art-consultation__section art-consultation__benefits">
        <h2>{content.title}</h2>
        <div className="art-consultation__benefit-grid">
            {content.items.map((item) => (
                <article className="art-consultation__benefit" key={item.title}>
                    <span className="art-consultation__benefit-icon" aria-hidden="true">{item.icon}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                </article>
            ))}
        </div>
    </section>
);

export default ConsultationBenefits;
