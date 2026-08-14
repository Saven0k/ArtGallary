// ProfilePage.tsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import type { ProfileSection } from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import Notifications from "../../components/shared/ProfileScreen/Sections/Notifications/Notifications";
import Statistics from "../../components/shared/ProfileScreen/Sections/Statistics/Statistics";
import Settings from "../../components/shared/ProfileScreen/Sections/Settings/Settings";
import PersonalInfo from "../../components/shared/ProfileScreen/Sections/PersonalInfo/PersonalInfo";
import ProfileHeader from "../../components/shared/ProfileScreen/ProfileHeader/ProfileHeader";
import ProfileSidebar from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import AnalyticsCard from "../../components/shared/ProfileScreen/AnalyticsCard/AnalyticsCard";
import { useAuth } from "../../hooks/useAuth";
import { getMyAuthorProfile, type AuthorProfileResponse } from "../../api/authors/main.api";
import { getUserById, type User } from "../../api/users/main.api";

const sectionIds: Record<ProfileSection, string> = {
    personal: "personal",
    notifications: "notifications",
    statistics: "statistics",
    likes: "likes",
    subscriptions: "subscriptions",
    settings: "settings",
};

const ProfilePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState<AuthorProfileResponse | User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const sectionFromUrl = searchParams.get("section") as ProfileSection | null;
    const initialSection = sectionFromUrl && Object.values(sectionIds).includes(sectionFromUrl as ProfileSection)
        ? sectionFromUrl as ProfileSection
        : "personal";

    const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);

    useEffect(() => {
        const getProfile = async () => {
            if (!authUser?.id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                if (authUser.role === "author") {
                    const data = await getMyAuthorProfile();
                    setProfile(data);
                } else {
                    const data = await getUserById(authUser.id);
                    setProfile(data);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [authUser]);

    useEffect(() => {
        const currentSection = searchParams.get("section");
        if (currentSection !== activeSection) {
            setSearchParams({ section: activeSection }, { replace: true });
        }
    }, [activeSection, searchParams, setSearchParams]);

    const handleSectionChange = (section: ProfileSection) => {
        setActiveSection(section);
        navigate(`/profile?section=${section}`, { replace: true });
    };

    const renderContent = () => {
        const userId = profile?.id || 0;
        const userRole = profile?.role || "user";

        switch (activeSection) {
            case "notifications":
                return <Notifications id={userId} role={userRole} />;
            case "statistics":
                return <Statistics id={userId} role={userRole} />;
            case "settings":
                return <Settings id={userId} role={userRole} />;
            case "likes":
                return <div>Мои лайки</div>;
            case "subscriptions":
                return <div>Мои подписки</div>;
            default:
                return <PersonalInfo id={userId} role={userRole} />;
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-page__container">
                    <div className="profile-page__loading">Загрузка...</div>
                </div>
            </main>
        );
    }

    const displayName = profile ? `${profile.name} ${profile.surname}` : "Пользователь";
    const displayRole = profile?.role || "user";
    const displayPlan = profile?.role === "author" ? (profile as AuthorProfileResponse).authorProfile?.plan || "Базовый" : "Базовый";

    return (
        <main className="profile-page">
            <div className="profile-page__container">
                <ProfileHeader
                    name={displayName}
                    role={displayRole}
                    avatar={profile?.authorProfile?.avatar_path || ""}
                    plan={displayPlan}
                />

                <div className="profile-page__layout">
                    <ProfileSidebar
                        active={activeSection}
                        onChange={handleSectionChange}
                        role={displayRole}
                    />

                    <section className="profile-page__content">
                        {renderContent()}
                    </section>

                    <AnalyticsCard
                        exhibitions={4}
                        artworks={27}
                    />
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;