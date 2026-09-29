
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProfileSection } from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import Settings from "../../components/shared/ProfileScreen/SettingsSection/SettingsSection";
import PersonalInfo from "../../components/shared/ProfileScreen/PersonalInfoSection/PersonalInfoSection";
import ProfileHeader from "../../components/shared/ProfileScreen/ProfileHeader/ProfileHeader";
import ProfileSidebar from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import { useAuth } from "../../hooks/useAuth";
import {
    getMyAuthorProfile,
    type AuthorProfileResponse,
} from "../../api/authors/main.api";
import { getUserById, type User } from "../../api/users/main.api";
import "./ProfilePage.scss";
import TariffPlan from "../../components/shared/ProfileScreen/TariffPlanSection/TariffPlanSection";
import Notifications from "../../components/shared/ProfileScreen/NotificationSection/NotificationSection";
import Statistics from "../../components/shared/ProfileScreen/StatisticsSection/StatisticsSection";
import Likes from "../../components/shared/ProfileScreen/LikesSection/LikesSection";
import Follows from "../../components/shared/ProfileScreen/FollowsSection/FollowsSection";
import Cart from "../../components/shared/ProfileScreen/CartSection/CartSection";

const sectionIds: Record<ProfileSection, string> = {
    personal: "personal",
    notifications: "notifications",
    statistics: "statistics",
    likes: "likes",
    cart: "cart",
    subscriptions: "subscriptions",
    settings: "settings",
    tariff: "tariff",
};


const AUTHOR_ONLY_SECTIONS: ProfileSection[] = ["statistics", "tariff"];

const isValidSection = (s: string | null): s is ProfileSection =>
    !!s && s in sectionIds;

const ProfilePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: authUser } = useAuth();

    const [profile, setProfile] = useState<AuthorProfileResponse | User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const isAuthor = authUser?.role === "author";


    const sectionFromUrl = searchParams.get("section");
    const [activeSection, setActiveSection] = useState<ProfileSection>(
        isValidSection(sectionFromUrl) ? sectionFromUrl : "personal"
    );


    useEffect(() => {
        const s = searchParams.get("section");
        let next: ProfileSection = isValidSection(s) ? s : "personal";


        if (AUTHOR_ONLY_SECTIONS.includes(next) && !isAuthor) {
            next = "personal";
        }

        setActiveSection((prev) => (prev === next ? prev : next));


        if (s !== null && s !== next) {
            setSearchParams({ section: next }, { replace: true });
        }
    }, [searchParams, setSearchParams, isAuthor]);


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


    const handleSectionChange = (section: ProfileSection) => {

        if (AUTHOR_ONLY_SECTIONS.includes(section) && !isAuthor) {
            return;
        }
        if (!(section in sectionIds)) {
            setSearchParams({}, { replace: false });
            return;
        }
        setSearchParams({ section }, { replace: false });
    };

    const renderContent = () => {
        const userId = profile?.id || 0;
        const userRole = profile?.role || "user";

        switch (activeSection) {
            case "notifications":
                return <Notifications id={userId} role={userRole} />;
            case "statistics":
                return isAuthor ? <Statistics authorId={userId} /> : null;
            case "settings":
                return <Settings id={userId} role={userRole} />;
            case "likes":
                return <Likes />;
            case "subscriptions":
                return <Follows />;
            case "cart":
                return <Cart />;
            case "tariff":
                return isAuthor ? <TariffPlan /> : null;
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

    const displayName = profile
        ? `${profile.name} ${profile.surname}`
        : "Пользователь";
    const displayRole = profile?.role || "user";
    const displayPlan =
        profile?.role === "author"
            ? (profile as AuthorProfileResponse).authorProfile?.plan || "free"
            : "free";

    return (
        <main className="profile-page">
            <div className="profile-page__container">
                <ProfileHeader
                    name={displayName}
                    role={displayRole}
                    avatar={profile?.authorProfile?.avatar_path || ""}
                    plan={displayPlan}
                    professionName={profile?.authorProfile?.profession?.name}
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
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;