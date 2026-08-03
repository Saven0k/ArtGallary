import "./FAQItem.css";
import ArrowIcon from "../icons/arrow.svg"

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
    return (
        <article className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
            <button
                className="faq-item__question"
                onClick={onClick}
                type="button"
                aria-expanded={isOpen}
            >
                <span className="faq-item__question-text">{question}</span>
                <img src={ArrowIcon} alt="Svg icon" className={`faq-item__icon ${isOpen ? "faq-item__icon--rotated" : ""}`} />
            </button>

            <div className={`faq-item__answer-wrapper ${isOpen ? "faq-item__answer-wrapper--expanded" : ""}`}>
                <div className="faq-item__answer">
                    <p className="faq-item__answer-text">{answer}</p>
                </div>
            </div>
        </article>
    );
};

export default FAQItem;