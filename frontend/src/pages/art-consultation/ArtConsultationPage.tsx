import Navigation from '../../components/layout/Navigation/Navigation';
import { useLanguage } from '../../hooks/useLanguage';
import ConsultationBenefits from './components/ConsultationBenefits';
import ConsultationFormats from './components/ConsultationFormats';
import ConsultationHero from './components/ConsultationHero';
import ConsultationProcess from './components/ConsultationProcess';
import ConsultationRequest from './components/ConsultationRequest';
import { artConsultationTranslations } from './lang';
import './ArtConsultationPage.scss';
import { useEffect } from 'react';

const ArtConsultationPage = () => {
    const { language } = useLanguage();
    const content = artConsultationTranslations[language];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    return (
        <main className="art-consultation">
            <Navigation />
            <div className="art-consultation__container">
                <ConsultationHero content={content.hero} />
                <ConsultationBenefits content={content.benefits} />
                <ConsultationFormats content={content.formats} />
                <ConsultationProcess content={content.process} />
                <ConsultationRequest content={content.request} />
            </div>
        </main>
    );
};

export default ArtConsultationPage;
