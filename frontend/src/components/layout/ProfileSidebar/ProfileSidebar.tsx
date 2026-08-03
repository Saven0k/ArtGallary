import { memo, useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { profileSidebarTranslations } from "./lang";
import { UserHeader } from "./components/UserHeader";
import { MenuSection } from "./components/MenuSection";
import { Meta } from "./components/Meta";
import { ModerationBanner } from "./components/ModerationBanner";
import { useUserData } from "./hooks/useUserData";
import { menuSectionsAdmin, menuSectionsArtist, menuSectionsModerator, menuSectionsUser } from "./sections";
import "./ProfileSideBar.css";
import { GuestHeader } from "./components/GuestHeader";
import { useLanguage } from "../../../hooks/useLanguage";

export interface ProfileSideBarProps {
    onClose: () => void;
    onNavigate: (path: string) => void;
    isAuthenticated?: boolean;
    isClosing?: boolean;
    onTransitionEnd?: () => void;
    userRole?: string;
}

const ProfileSideBar = memo(({
    onClose,
    onNavigate,
    isClosing = false,
    onTransitionEnd,
    userRole
}: ProfileSideBarProps) => {
    const [isEntered, setIsEntered] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];
    const { userData, isModerated } = useUserData(user);

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handleLinkClick = (path: string) => {
        onNavigate(path);
        onClose();
    };

    const handleLogout = () => {
        onClose();
        logout();
    };

    const handleSettings = () => {
        onClose();
        onNavigate('/settings');
    };

    const getMenuSections = () => {
        switch (userRole) {
            case 'artist':
                return isModerated === false ? getArtistLimitedSections() : menuSectionsArtist;
            case 'moderator':
                return menuSectionsModerator;
            case 'admin':
                return menuSectionsAdmin;
            default:
                return menuSectionsUser;
        }
    };

    const getArtistLimitedSections = () => {
        return [
            {
                titleKey: "profile",
                items: [
                    { icon: "👤", labelKey: "artist.myProfile", path: "/profile" }
                ]
            }
        ];
    };

    const renderMenu = () => {
        const sections = getMenuSections();
        return (
            <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                {userRole === 'artist' && isModerated === false && <ModerationBanner />}
                {sections.map((section, index) => (
                    <MenuSection
                        key={index}
                        section={section}
                        onItemClick={handleLinkClick}
                        getLabel={getMenuItemLabel}
                        onClose={onClose}
                    />
                ))}
            </nav>
        );
    };

    const getMenuItemLabel = (labelKey: string): string => {
        const parts = labelKey.split('.');
        if (parts.length === 2) {
            const category = parts[0] as keyof typeof lang;
            const key = parts[1] as string;
            if (lang[category] && (lang[category] as any)[key]) {
                return (lang[category] as any)[key];
            }
        }
        return labelKey;
    };

    return (
        <div className="sidebarProfile-box">
            <div
                className={`sidebarProfile__overlay ${
                    isClosing ? "sidebarProfile__overlay--closing" : "sidebarProfile__overlay--visible"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                id="sidebarProfile"
                className={`sidebarProfile ${
                    isEntered ? "sidebarProfile--open" : ""
                } ${isClosing ? "sidebarProfile--closing" : ""}`}
                role="dialog"
                aria-label={lang.sidebar.close}
                aria-modal="true"
                onTransitionEnd={(e) =>
                    e.propertyName === "transform" && isClosing && onTransitionEnd?.()
                }
            >
                <div className="sidebarProfile__header">
                    {isAuthenticated ? (
                        <UserHeader 
                            userData={userData} 
                            onEdit={() => onNavigate("profile/edit")}
                            onClose={onClose}
                        />
                    ) : (
                        <GuestHeader 
                            onNavigate={onNavigate}
                            onClose={onClose}
                        />
                    )}
                    <button
                        className="sidebarProfile__close"
                        aria-label={lang.sidebar.close}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {isAuthenticated && renderMenu()}

                <div className="sidebarProfile__footer">
                    <div className="sidebarProfile__actions">
                        <button
                            className="sidebarProfile__action-btn sidebarProfile__action-btn--secondary"
                            onClick={handleSettings}
                        >
                            ⚙️ {lang.sidebar.actions.settings}
                        </button>
                        {isAuthenticated && (
                            <button
                                className="sidebarProfile__action-btn sidebarProfile__action-btn--danger"
                                onClick={handleLogout}
                            >
                                🚪 {lang.sidebar.actions.logout}
                            </button>
                        )}
                    </div>
                    <Meta />
                </div>
            </aside>
        </div>
    );
});

export default ProfileSideBar;