import { useState } from "react";

import "./ProfilePage.css";
import type { ProfileSection } from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import Notifications from "../../components/shared/ProfileScreen/ProfileContent/Notifications/Notifications";
import Statistics from "../../components/shared/ProfileScreen/ProfileContent/Statistics/Statistics";
import { Settings } from "lucide-react";
import PersonalInfo from "../../components/shared/ProfileScreen/ProfileContent/PersonalInfo/PersonalInfo";
import ProfileHeader from "../../components/shared/ProfileScreen/ProfileHeader/ProfileHeader";
import ProfileSidebar from "../../components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar";
import AnalyticsCard from "../../components/shared/ProfileScreen/AnalyticsCard/AnalyticsCard";

const ProfilePage = () => {
    const [activeSection, setActiveSection] =
        useState<ProfileSection>("personal");

    const renderContent = () => {
        switch (activeSection) {
            case "notifications":
                return <Notifications />;

            case "statistics":
                return <Statistics />;

            case "settings":
                return <Settings />;

            default:
                return <PersonalInfo />;
        }
    };

    return (
        <main className="profile-page">

            <div className="profile-page__container">

                {/* TODO: данные вставить */}
                <ProfileHeader
                    name="Иван Иванов"
                    role="Художник"
                    avatar=""
                    plan="Базовый"
                />

                <div className="profile-page__layout">

                    <ProfileSidebar
                        active={activeSection}
                        onChange={setActiveSection}
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