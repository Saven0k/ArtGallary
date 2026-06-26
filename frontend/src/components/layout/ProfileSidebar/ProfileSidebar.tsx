import { memo, useState, useEffect } from "react";
import "./ProfileSideBar.css";
import { menuSectionsAdmin, menuSectionsArtist, menuSectionsGuest, menuSectionsModerator, menuSectionsUser, type MenuItem, type MenuSection } from "./sections";
import { Benefits } from "./benefits";
import { Meta } from "./meta";
import { getUserProfile } from "../../../api/users/main.api";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { guestStorage } from "../../../services/guest.service";
import { getArtistById } from "../../../api/artists/main.api";
import { useLanguage } from "../../../context/LanguageContext";
import { profileSidebarTranslations } from "./lang";

export interface ProfileSideBarProps {
    onClose: () => void;
    onNavigate: (path: string) => void;
    isAuthenticated?: boolean;
    isClosing?: boolean;
    onTransitionEnd?: () => void;
    userRole?: string;
}

export interface UserProfile {
    name: string;
    surname: string;
    avatar_path: string;
}

const ProfileSideBar = memo(
    ({ onClose, onNavigate, isClosing = false, onTransitionEnd, userRole }: ProfileSideBarProps) => {
        const [isEntered, setIsEntered] = useState(false);
        const [userData, setUserData] = useState<UserProfile>({ name: "", surname: "", avatar_path: "" });
        const [isModerated, setIsModerated] = useState<boolean | null>(null);
        const { user, isAuthenticated, logout, isGuestRef } = useAuth();
        const navigate = useNavigate();
        const { language } = useLanguage();
        const lang = profileSidebarTranslations[language];

        useEffect(() => {
            const id = requestAnimationFrame(() => setIsEntered(true));
            return () => cancelAnimationFrame(id);
        }, []);

        useEffect(() => {
            const getData = async () => {
                if (!user) return;
                const data = await getUserProfile(user.id);
                setUserData(data);

                if (user.role === 'artist') {
                    try {
                        const artistData = await getArtistById(user.id);
                        const moderate = artistData?.artistProfile?.moderate as any;
                        setIsModerated(moderate?.moderate === true);
                    } catch (error) {
                        console.error('Error checking moderation:', error);
                        setIsModerated(false);
                    }
                }
            }
            getData();
        }, [user]);

        const handleLinkClick = (path: string) => {
            onNavigate(path);
            onClose();
        };

        const handleLoginClick = () => {
            onNavigate('/login');
            onClose();
        };

        const hasBadge = (item: MenuItem): item is MenuItem & { badge: number } => {
            return item.badge !== null && item.badge !== undefined && item.badge > 0;
        };

        const getSectionTitle = (titleKey: string): string => {
            return lang.sections[titleKey as keyof typeof lang.sections] || titleKey;
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

        const MenuSelectionArtistLimited = () => {
            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    <div className="sidebarProfile__moderation-banner">
                        <div className="sidebarProfile__moderation-icon">⏳</div>
                        <div className="sidebarProfile__moderation-text">
                            <h4>{lang.sidebar.moderationBanner.title}</h4>
                            <p>{lang.sidebar.moderationBanner.description}</p>
                        </div>
                    </div>
                    <div className="sidebarProfile__section">
                        <h3 className="sidebarProfile__section-title">{lang.sections.profile}</h3>
                        <ul className="sidebarProfile__menu">
                            <li className="sidebarProfile__menu-item">
                                <button
                                    className="sidebarProfile__link"
                                    aria-label={lang.artist.myProfile}
                                    onClick={() => handleLinkClick('/profile')}
                                >
                                    <span className="sidebarProfile__icon" aria-hidden="true">👤</span>
                                    <span className="sidebarProfile__label">{lang.artist.myProfile}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>
            )
        }

        const MenuSelectionArtist = () => {
            if (isModerated === false) {
                return <MenuSelectionArtistLimited />;
            }

            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    {menuSectionsArtist.map((section: MenuSection, index: number) => (
                        <div key={index} className="sidebarProfile__section">
                            <h3 className="sidebarProfile__section-title">{getSectionTitle(section.titleKey)}</h3>
                            <ul className="sidebarProfile__menu">
                                {section.items.map((item: MenuItem, itemIndex: number) => {
                                    const label = getMenuItemLabel(item.labelKey);
                                    return (
                                        <li key={itemIndex} className="sidebarProfile__menu-item">
                                            <button
                                                className={`sidebarProfile__link`}
                                                aria-label={label}
                                                onClick={() => handleLinkClick(item.path)}
                                            >
                                                <span className="sidebarProfile__icon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                                <span className="sidebarProfile__label">{label}</span>
                                                {hasBadge(item) && (
                                                    <span className="sidebarProfile__badge">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            )
        }

        const MenuSelectionUser = () => {
            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    {menuSectionsUser.map((section: MenuSection, index: number) => (
                        <div key={index} className="sidebarProfile__section">
                            <h3 className="sidebarProfile__section-title">{getSectionTitle(section.titleKey)}</h3>
                            <ul className="sidebarProfile__menu">
                                {section.items.map((item: MenuItem, itemIndex: number) => {
                                    const label = getMenuItemLabel(item.labelKey);
                                    return (
                                        <li key={itemIndex} className="sidebarProfile__menu-item">
                                            <button
                                                className={`sidebarProfile__link`}
                                                aria-label={label}
                                                onClick={() => handleLinkClick(item.path)}
                                            >
                                                <span className="sidebarProfile__icon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                                <span className="sidebarProfile__label">{label}</span>
                                                {hasBadge(item) && (
                                                    <span className="sidebarProfile__badge">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            )
        }

        const MenuSelectionGuest = () => {
            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    {menuSectionsGuest.map((section: MenuSection, index: number) => (
                        <div key={index} className="sidebarProfile__section">
                            <h3 className="sidebarProfile__section-title">{getSectionTitle(section.titleKey)}</h3>
                            <ul className="sidebarProfile__menu">
                                {section.items.map((item: MenuItem, itemIndex: number) => {
                                    const label = getMenuItemLabel(item.labelKey);
                                    return (
                                        <li key={itemIndex} className="sidebarProfile__menu-item">
                                            <button
                                                className={`sidebarProfile__link`}
                                                aria-label={label}
                                                onClick={() => handleLinkClick(item.path)}
                                            >
                                                <span className="sidebarProfile__icon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                                <span className="sidebarProfile__label">{label}</span>
                                                {hasBadge(item) && (
                                                    <span className="sidebarProfile__badge">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            )
        }

        const MenuSelectionAdmin = () => {
            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    {menuSectionsAdmin.map((section: MenuSection, index: number) => (
                        <div key={index} className="sidebarProfile__section">
                            <h3 className="sidebarProfile__section-title">{getSectionTitle(section.titleKey)}</h3>
                            <ul className="sidebarProfile__menu">
                                {section.items.map((item: MenuItem, itemIndex: number) => {
                                    const label = getMenuItemLabel(item.labelKey);
                                    return (
                                        <li key={itemIndex} className="sidebarProfile__menu-item">
                                            <button
                                                className={`sidebarProfile__link`}
                                                aria-label={label}
                                                onClick={() => handleLinkClick(item.path)}
                                            >
                                                <span className="sidebarProfile__icon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                                <span className="sidebarProfile__label">{label}</span>
                                                {hasBadge(item) && (
                                                    <span className="sidebarProfile__badge">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            )
        }

        const MenuSelectionModerator = () => {
            return (
                <nav className="sidebarProfile__nav" role="navigation" aria-label={lang.sidebar.close}>
                    {menuSectionsModerator.map((section: MenuSection, index: number) => (
                        <div key={index} className="sidebarProfile__section">
                            <h3 className="sidebarProfile__section-title">{getSectionTitle(section.titleKey)}</h3>
                            <ul className="sidebarProfile__menu">
                                {section.items.map((item: MenuItem, itemIndex: number) => {
                                    const label = getMenuItemLabel(item.labelKey);
                                    return (
                                        <li key={itemIndex} className="sidebarProfile__menu-item">
                                            <button
                                                className={`sidebarProfile__link`}
                                                aria-label={label}
                                                onClick={() => handleLinkClick(item.path)}
                                            >
                                                <span className="sidebarProfile__icon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                                <span className="sidebarProfile__label">{label}</span>
                                                {hasBadge(item) && (
                                                    <span className="sidebarProfile__badge">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            )
        }

        return (
            <div className="sidebarProfile-box">
                <div
                    className={`sidebarProfile__overlay ${isClosing ? "sidebarProfile__overlay--closing" : "sidebarProfile__overlay--visible"}`}
                    onClick={onClose}
                    aria-hidden="true"
                />
                <aside
                    id="sidebarProfile"
                    className={`sidebarProfile ${isEntered ? "sidebarProfile--open" : ""} ${isClosing ? "sidebarProfile--closing" : ""}`}
                    role="dialog"
                    aria-label={lang.sidebar.close}
                    aria-modal="true"
                    onTransitionEnd={(e) => e.propertyName === "transform" && isClosing && onTransitionEnd?.()}
                >
                    <div className="sidebarProfile__header">
                        {isAuthenticated ? (
                            <div className="sidebarProfile__user-info">
                                {userData.avatar_path ? (
                                    <img
                                        src={`${userData.avatar_path}`}
                                        alt={`${lang.sidebar.userInfo.avatarAlt} ${userData.name}`}
                                        className="sidebarProfile__avatar"
                                        width={48}
                                        height={48}
                                        loading="lazy"
                                    />
                                ) : (
                                    <button onClick={() => {
                                        navigate("profile/edit")
                                        onClose()
                                    }} className="sidebarProfile__avatar">+</button>
                                )}
                                <div className="sidebarProfile__user-details">
                                    <h2 className="sidebarProfile__user-name">{userData.name}</h2>
                                    <p className="sidebarProfile__user-email">{userData.surname}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="sidebarProfile__guest-header">
                                <div className="sidebarProfile__guest-icon">🎨</div>
                                <h2 className="sidebarProfile__guest-title">{lang.sidebar.guest.title}</h2>
                            </div>
                        )}
                        <button
                            className="sidebarProfile__close"
                            aria-label={lang.sidebar.close}
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    </div>

                    {isAuthenticated ? (
                        ((userRole === "artist") && <MenuSelectionArtist />)
                        ||
                        ((userRole === "moderator") && <MenuSelectionModerator />)
                        ||
                        ((userRole === "user") && <MenuSelectionUser />)
                        ||
                        ((userRole === "admin") && <MenuSelectionAdmin />)
                    ) : (
                        isGuestRef ? (
                            <>
                                <MenuSelectionGuest />
                            </>
                        ) : (
                            <div className="sidebarProfile__guest-content">
                                <div className="sidebarProfile__guest-message">
                                    <h3 className="sidebarProfile__guest-subtitle">{lang.sidebar.guest.subtitle}</h3>
                                    <p className="sidebarProfile__guest-text">
                                        {lang.sidebar.guest.text}
                                    </p>
                                </div>
                                <div className="sidebarProfile__guest-actions">
                                    <button
                                        className="sidebarProfile__login-btn"
                                        onClick={handleLoginClick}
                                    >
                                        {lang.sidebar.guest.login}
                                    </button>
                                    {!guestStorage.isGuest() && <button
                                        className="sidebarProfile__guest-btn"
                                        onClick={() => {
                                            guestStorage.initGuest();
                                            onClose();
                                            navigate("/arts");
                                        }}
                                    >
                                        {lang.sidebar.guest.continueAsGuest}
                                    </button>}
                                </div>
                                <Benefits />
                            </div>
                        )
                    )}

                    <div className="sidebarProfile__footer">
                        <div className="sidebarProfile__actions">
                            <button
                                className="sidebarProfile__action-btn sidebarProfile__action-btn--secondary"
                                onClick={() => {
                                    onClose();
                                    onNavigate('/settings');
                                }}
                            >
                                ⚙️ {lang.sidebar.actions.settings}
                            </button>
                            {
                                isAuthenticated &&
                                <button
                                    className="sidebarProfile__action-btn sidebarProfile__action-btn--danger"
                                    onClick={() => {
                                        onClose();
                                        logout();
                                    }}
                                >
                                    🚪 {lang.sidebar.actions.logout}
                                </button>
                            }
                            {/* TODO: смена языка добавить в красивом виде */}
                        </div>
                        <Meta />
                    </div>
                </aside>
            </div>
        );
    }
);

export default ProfileSideBar;