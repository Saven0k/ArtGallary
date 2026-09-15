import Navigation from '../../components/layout/Navigation/Navigation';
import './AboutPage.scss';
import AboutUs from './components/AboutUs/AboutUs';
import Banner from './components/Banner/Banner';
import Team from './components/Team/Team';

const AboutPage = () => {
    return (
        <main className="about-page">
            <Navigation />
            <AboutUs />
            <Banner />
            <Team />
        </main>

    );
};

export default AboutPage;