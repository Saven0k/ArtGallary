interface ConsultationProcessProps {
    content: {
        title: string;
        items: ReadonlyArray<{ number: string; title: string; text: string }>;
    };
}

const ConsultationProcess = ({ content }: ConsultationProcessProps) => (
    <section className="art-consultation__section art-consultation__process">
        <h2>{content.title}</h2>
        <ol>
            {content.items.map((item) => (
                <li key={item.number}>
                    <span>{item.number}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                </li>
            ))}
        </ol>
    </section>
);

export default ConsultationProcess;
