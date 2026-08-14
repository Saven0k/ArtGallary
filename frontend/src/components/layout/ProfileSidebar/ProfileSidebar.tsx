// src/components/ProfileSideBar/ProfileSideBar.tsx
import { memo, useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { MenuSection } from "./components/MenuSection";
import { Meta } from "./components/Meta";
import { GuestHeader } from "./components/GuestHeader";
import { UserHeader } from "./components/UserHeader";
import { ModerationBanner } from "./components/ModerationBanner";
import { menuSectionsAdmin, menuSectionsAuthor, menuSectionsModerator, menuSectionsUser } from "./sections";
import { sidebarTranslations } from "./lang";
import "./ProfileSideBar.scss";

export interface ProfileSideBarProps {
    onClose: () => void;
    onNavigate: (path: string) => void;
    isAuthenticated?: boolean;
    isClosing?: boolean;
    onTransitionEnd?: () => void;
    userRole?: string;
    userData?: {
        name: string;
        surname: string;
        email?: string;
        avatar_path?: string | null;
    };
}

const ProfileSideBar = memo(({
    onClose,
    onNavigate,
    isClosing = false,
    onTransitionEnd,
    userRole = 'user',
    userData,
    isAuthenticated = false
}: ProfileSideBarProps) => {
    const [isEntered, setIsEntered] = useState(false);
    const { logout } = useAuth();
    const { language } = useLanguage();
    const t = sidebarTranslations[language];

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
            case 'author':
                return menuSectionsAuthor;
            case 'moderator':
                return menuSectionsModerator;
            case 'admin':
                return menuSectionsAdmin;
            default:
                return menuSectionsUser;
        }
    };

    const getMenuItemLabel = (labelKey: string): string => {
        const parts = labelKey.split('.');
        if (parts.length === 2) {
            const [category, key] = parts;
            if (category === 'common') {
                return t.common[key as keyof typeof t.common] || labelKey;
            }
            const categoryObj = t[category as keyof typeof t];
            if (categoryObj && typeof categoryObj === 'object') {
                return (categoryObj as any)[key] || labelKey;
            }
        }
        return labelKey;
    };

    const renderMenu = () => {
        const sections = getMenuSections();
        return (
            <nav className="sidebarProfile__nav" role="navigation">
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
                aria-modal="true"
                onTransitionEnd={(e) =>
                    e.propertyName === "transform" && isClosing && onTransitionEnd?.()
                }
            >
                <div className="sidebarProfile__header">
                    {isAuthenticated && userData ? (
                        <UserHeader 
                            userData={userData} 
                            onEdit={() => onNavigate("/profile/edit")}
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
                        onClick={onClose}
                        aria-label="Закрыть меню"
                    >
                        ✕
                    </button>
                </div>

                {isAuthenticated && (
                    <>
                        {userRole === 'author' && (
                            <ModerationBanner />
                        )}
                        {renderMenu()}
                    </>
                )}

                <div className="sidebarProfile__footer">
                    <div className="sidebarProfile__actions">
                        <button
                            className="sidebarProfile__action-btn sidebarProfile__action-btn--secondary"
                            onClick={handleSettings}
                            aria-label="Настройки"
                        >
                            ⚙️
                        </button>
                        {isAuthenticated && (
                            <button
                                className="sidebarProfile__action-btn sidebarProfile__action-btn--danger"
                                onClick={handleLogout}
                                aria-label="Выйти"
                            >
                                🚪
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