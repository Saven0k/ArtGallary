// src/pages/admin/AdminPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import {
    adminTranslations,
    ADMIN_SECTIONS,
    isValidAdminSection,
    type AdminSectionId,
} from './lang';
import AdminSidebar from '../../components/shared/Admin/Sidebar/AdminSidebar';
import ModerationSection from '../../components/shared/Admin/sections/Moderation/ModerationSection';
import ArtsSection from '../../components/shared/Admin/sections/Arts/ArtsSection';
import AuthorsSection from '../../components/shared/Admin/sections/Authors/AuthorsSection';
import UsersSection from '../../components/shared/Admin/sections/Users/UsersSection';
import ModeratorsSection from '../../components/shared/Admin/sections/Moderators/ModeratorsSection';
import GenresSection from '../../components/shared/Admin/sections/Genres/GenresSection';
import StylesSection from '../../components/shared/Admin/sections/Styles/StylesSection';
import ArtTypesSection from '../../components/shared/Admin/sections/ArtTypes/ArtTypesSection';
import ProfessionsSection from '../../components/shared/Admin/sections/Professions/ProfessionsSection';
import EventsSection from '../../components/shared/Admin/sections/Events/EventsSection';
import RatingsSection from '../../components/shared/Admin/sections/Ratings/RatingsSection';
import './AdminPage.scss';

const AdminPage = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = adminTranslations[language];

    const [searchParams, setSearchParams] = useSearchParams();
    const role = user?.role ?? 'user';

    // секции, доступные текущей роли
    const available = ADMIN_SECTIONS.filter((s) => s.roles.includes(role));

    // URL — источник истины для активной секции
    const sectionFromUrl = searchParams.get('section');
    const initial: AdminSectionId =
        isValidAdminSection(sectionFromUrl) &&
        available.some((s) => s.id === sectionFromUrl)
            ? sectionFromUrl
            : (available[0]?.id ?? 'dashboard');

    const [active, setActive] = useState<AdminSectionId>(initial);

    useEffect(() => {
        const s = searchParams.get('section');
        const next: AdminSectionId =
            isValidAdminSection(s) && available.some((x) => x.id === s)
                ? s
                : (available[0]?.id ?? 'dashboard');

        setActive((prev) => (prev === next ? prev : next));

        if (s !== null && s !== next) {
            setSearchParams({ section: next }, { replace: true });
        }
    }, [searchParams, setSearchParams, available]);

    const handleChange = (section: AdminSectionId) => {
        if (!available.some((s) => s.id === section)) return;
        setSearchParams({ section }, { replace: false });
    };

    const renderSection = () => {
        switch (active) {
            case 'moderation':  return <ModerationSection />;
            case 'arts':        return <ArtsSection />;
            case 'authors':     return <AuthorsSection />;
            case 'users':       return <UsersSection />;
            case 'moderators':  return <ModeratorsSection />;
            case 'genres':      return <GenresSection />;
            case 'styles':      return <StylesSection />;
            case 'artTypes':    return <ArtTypesSection />;
            case 'professions': return <ProfessionsSection />;
            case 'events':      return <EventsSection />;
            case 'ratings':     return <RatingsSection />;
            default:            return null;
        }
    };

    return (
        <main className="admin-page">
            <div className="admin-page__container">
                <AdminSidebar
                    sections={available}
                    active={active}
                    onChange={handleChange}
                    title={t.title}
                    labels={t.sections}
                />

                <section className="admin-page__content">
                    {renderSection()}
                </section>
            </div>
        </main>
    );
};

export default AdminPage;