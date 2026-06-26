import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supportTranslations } from './lang';
import './Support.css';

export const Support = () => {
    const { language } = useLanguage();
    const lang = supportTranslations[language];
    const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);

    const faqs = lang.faqItems.map((item) => ({
        ...item,
        category: item.category as 'general' | 'account' | 'payment' | 'technical'
    }));

    const filteredFaqs = selectedCategory === 'all' 
        ? faqs 
        : faqs.filter(faq => faq.category === selectedCategory);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    const getCategoryName = (category: string) => {
        const categories = lang.faq.categories;
        switch(category) {
            case 'general': return categories.general;
            case 'account': return categories.account;
            case 'payment': return categories.payment;
            case 'technical': return categories.technical;
            default: return '';
        }
    };

    return (
        <div className="support">
            <div className="support__hero">
                <div className="support__hero-content">
                    <div className="support__hero-icon">🎨</div>
                    <h1 className="support__hero-title">{lang.hero.title}</h1>
                    <p className="support__hero-subtitle">
                        {lang.hero.subtitle}
                    </p>
                </div>
            </div>

            <div className="support__container">
                <div className="support__quick-links">
                    <div className="support__quick-card">
                        <div className="support__quick-icon">📚</div>
                        <h3>{lang.quickLinks.knowledge.title}</h3>
                        <p>{lang.quickLinks.knowledge.text}</p>
                    </div>
                    <div className="support__quick-card">
                        <div className="support__quick-icon">💬</div>
                        <h3>{lang.quickLinks.chat.title}</h3>
                        <p>{lang.quickLinks.chat.text}</p>
                    </div>
                    <div className="support__quick-card">
                        <div className="support__quick-icon">📧</div>
                        <h3>{lang.quickLinks.email.title}</h3>
                        <p>{lang.quickLinks.email.text}</p>
                    </div>
                    <div className="support__quick-card">
                        <div className="support__quick-icon">📞</div>
                        <h3>{lang.quickLinks.hotline.title}</h3>
                        <p>{lang.quickLinks.hotline.text}</p>
                    </div>
                </div>

                <div className="support__faq">
                    <div className="support__section-header">
                        <h2 className="support__section-title">{lang.faq.title}</h2>
                        <p className="support__section-subtitle">
                            {lang.faq.subtitle}
                        </p>
                    </div>

                    <div className="support__faq-categories">
                        <button
                            className={`support__category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            {lang.faq.categories.all}
                        </button>
                        <button
                            className={`support__category-btn ${selectedCategory === 'general' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('general')}
                        >
                            {lang.faq.categories.general}
                        </button>
                        <button
                            className={`support__category-btn ${selectedCategory === 'account' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('account')}
                        >
                            {lang.faq.categories.account}
                        </button>
                        <button
                            className={`support__category-btn ${selectedCategory === 'payment' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('payment')}
                        >
                            {lang.faq.categories.payment}
                        </button>
                        <button
                            className={`support__category-btn ${selectedCategory === 'technical' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('technical')}
                        >
                            {lang.faq.categories.technical}
                        </button>
                    </div>

                    <div className="support__faq-list">
                        {filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className={`support__faq-item ${activeFAQ === faq.id ? 'active' : ''}`}
                            >
                                <div
                                    className="support__faq-question"
                                    onClick={() => setActiveFAQ(activeFAQ === faq.id ? null : faq.id)}
                                >
                                    <span className="support__faq-question-text">{faq.question}</span>
                                    <span className="support__faq-icon">
                                        {activeFAQ === faq.id ? '−' : '+'}
                                    </span>
                                </div>
                                {activeFAQ === faq.id && (
                                    <div className="support__faq-answer">
                                        <p>{faq.answer}</p>
                                        <div className="support__faq-category">
                                            {getCategoryName(faq.category)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="support__contact">
                    <div className="support__contact-info">
                        <h2 className="support__contact-title">{lang.contact.title}</h2>
                        <p className="support__contact-description">
                            {lang.contact.description}
                        </p>
                        <div className="support__contact-stats">
                            <div className="support__stat">
                                <div className="support__stat-value">~5 мин</div>
                                <div className="support__stat-label">{lang.contact.stats.responseTime}</div>
                            </div>
                            <div className="support__stat">
                                <div className="support__stat-value">98%</div>
                                <div className="support__stat-label">{lang.contact.stats.satisfaction}</div>
                            </div>
                            <div className="support__stat">
                                <div className="support__stat-value">24/7</div>
                                <div className="support__stat-label">{lang.contact.stats.support}</div>
                            </div>
                        </div>
                    </div>

                    <form className="support__form" onSubmit={handleSubmit}>
                        <h3 className="support__form-title">{lang.contact.form.title}</h3>
                        
                        {showSuccess && (
                            <div className="support__success">
                                {lang.contact.form.success}
                            </div>
                        )}

                        <div className="support__form-row">
                            <input
                                type="text"
                                placeholder={lang.contact.form.name}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder={lang.contact.form.email}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <input
                            type="text"
                            placeholder={lang.contact.form.subject}
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />

                        <textarea
                            placeholder={lang.contact.form.message}
                            rows={6}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                        />

                        <button type="submit" className="support__submit-btn">
                            {lang.contact.form.button}
                        </button>
                    </form>
                </div>

                <div className="support__resources">
                    <h3 className="support__resources-title">{lang.resources.title}</h3>
                    <div className="support__resources-grid">
                        <a href="#" className="support__resource-card">
                            <span className="support__resource-icon">📖</span>
                            <div>
                                <h4>{lang.resources.items.guide.title}</h4>
                                <p>{lang.resources.items.guide.text}</p>
                            </div>
                        </a>
                        <a href="#" className="support__resource-card">
                            <span className="support__resource-icon">🎨</span>
                            <div>
                                <h4>{lang.resources.items.photo.title}</h4>
                                <p>{lang.resources.items.photo.text}</p>
                            </div>
                        </a>
                        <a href="#" className="support__resource-card">
                            <span className="support__resource-icon">⚖️</span>
                            <div>
                                <h4>{lang.resources.items.legal.title}</h4>
                                <p>{lang.resources.items.legal.text}</p>
                            </div>
                        </a>
                        <a href="#" className="support__resource-card">
                            <span className="support__resource-icon">🎓</span>
                            <div>
                                <h4>{lang.resources.items.training.title}</h4>
                                <p>{lang.resources.items.training.text}</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};