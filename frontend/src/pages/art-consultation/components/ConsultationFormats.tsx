interface ConsultationFormatsProps {
    content: {
        title: string;
        action: string;
        items: ReadonlyArray<{ image: string; title: string; text: string }>;
    };
}

const ConsultationFormats = ({ content }: ConsultationFormatsProps) => (
    <section className="art-consultation__section art-consultation__formats">
        <h2>{content.title}</h2>
        <div className="art-consultation__format-grid">
            {content.items.map((item) => (
                <article className="art-consultation__format" key={item.title}>
                    <img src={item.image} alt="" />
                    <div className="art-consultation__format-copy">
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                        <a href="#consultation-request">{content.action}</a>
                    </div>
                </article>
            ))}
        </div>
    </section>
);

export default ConsultationFormats;
