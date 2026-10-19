import Navigation from '../components/layout/Navigation/Navigation';
import Support from './help/components/Support/Support';
import './ContactsPage.scss';

const ContactsPage = () => <main className="contacts-page"><Navigation /><div className="contacts-page__content"><Support /></div></main>;
export default ContactsPage;
