interface ConsultationRequestProps {
    content: {
        title: string;
        description: string;
        name: string;
        contact: string;
        message: string;
        submit: string;
    };
}

const ConsultationRequest = ({ content }: ConsultationRequestProps) => (
    <section className="art-consultation__request" id="consultation-request">
        <div>
            <h2>{content.title}</h2>
            <p>{content.description}</p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
            <label>
                <span>{content.name}</span>
                <input type="text" name="name" />
            </label>
            <label>
                <span>{content.contact}</span>
                <input type="text" name="contact" />
            </label>
            <label className="art-consultation__request-message">
                <span>{content.message}</span>
                <textarea name="message" rows={3} />
            </label>
            <button type="submit">{content.submit}</button>
        </form>
    </section>
);

export default ConsultationRequest;
