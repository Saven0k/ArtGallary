import Hero from './components/Hero';
import About from './components/About';
import Advantages from './components/Advantage';
import GallerySelection from './components/GallerySelection';
import Events from './components/Events';
import Consultation from './components/Consultation';

const HomePage = () => {
    return (
        <main className="home-page">
            <Hero />
            <About />
            <Advantages />
            <GallerySelection />
            <Events />
            <Consultation />
        </main>
    );
};

export default HomePage;