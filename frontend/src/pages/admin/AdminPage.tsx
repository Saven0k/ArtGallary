// src/pages/Admin/AdminPage.tsx
import { useState } from 'react';
import { adminTranslations } from './lang';
import AdminStyles from '../../components/shared/Admin/AdminStyles/AdminStyles';
import AdminArtTypes from '../../components/shared/Admin/AdminArtTypes/AdminArtTypes';
import AdminGenres from '../../components/shared/Admin/AdminGenres/AdminGenres';
import AdminProfessions from '../../components/shared/Admin/AdminProfessions/AdminProfessions';
import './AdminPage.scss';

type Tab = 'styles' | 'artTypes' | 'genres' | 'professions';

const AdminPage = () => {
    const t = adminTranslations.admin;
    const [activeTab, setActiveTab] = useState<Tab>('styles');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'styles', label: t.styles },
        { id: 'artTypes', label: t.artTypes },
        { id: 'genres', label: t.genres },
        { id: 'professions', label: t.professions },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'styles': return <AdminStyles />;
            case 'artTypes': return <AdminArtTypes />;
            case 'genres': return <AdminGenres />;
            case 'professions': return <AdminProfessions />;
            default: return null;
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1 className="admin-page__title">{t.title}</h1>
                <p className="admin-page__subtitle">{t.subtitle}</p>
            </div>

            <div className="admin-page__tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`admin-page__tab ${activeTab === tab.id ? 'admin-page__tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-page__content">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;