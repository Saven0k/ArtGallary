import { memo, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ProfileSidebar from "../ProfileSidebar/ProfileSidebar";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { getAuthorById, type AuthorProfileResponse } from "../../../api/authors/main.api";
import { getUserById, type User } from "../../../api/users/main.api";
import { headerTranslations } from "./lang";
import "./Header.scss";
import Logo from "./logo.svg";
import Like from "./like.svg";
import Cart from "./cart.svg";
import Search from "./search.svg";
import ProfileIcon from "./profile.svg";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

interface UserDataForSidebar {
    name: string;
    surname: string;
    email?: string;
    avatar_path?: string | null;
}

const Header = memo(() => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarClosing, setIsSidebarClosing] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const { language } = useLanguage();

    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserDataForSidebar | null>(null);

    // Получаем переводы для текущего языка
    const lang = headerTranslations[language];

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarClosing(true);
    }, []);

    const handleOpenSidebar = useCallback(() => {
        setIsSidebarClosing(false);
        setIsSidebarOpen(true);
    }, []);

    const handleSidebarTransitionEnd = useCallback(() => {
        if (isSidebarClosing) {
            setIsSidebarOpen(false);
            setIsSidebarClosing(false);
        }
    }, [isSidebarClosing]);

    const handleCloseSearchModal = useCallback(() => {
        setIsSearchModalOpen(false);
    }, []);

    const handleSidebarNavigate = useCallback(
        (path: string) => {
            navigate(path);
            handleCloseSidebar();
        },
        [navigate, handleCloseSidebar]
    );

    const extractUserData = useCallback((data: AuthorProfileResponse | User | null): UserDataForSidebar | null => {
        if (!data) return null;

        if ('authorProfile' in data && data.authorProfile) {
            return {
                name: data.name,
                surname: data.surname,
                email: data.email,
                avatar_path: data.authorProfile.avatar_path || null,
            };
        } else {
            const userData = data as User;
            return {
                name: userData.name,
                surname: userData.surname,
                email: userData.email,
                avatar_path: null,
            };
        }
    }, []);

    useEffect(() => {
        const getData = async () => {
            if (!user?.id) {
                setProfile(null);
                return;
            }

            try {
                if (user?.role === 'author') {
                    const res = await getAuthorById(user.id);
                    if (res) {
                        const extracted = extractUserData(res);
                        setProfile(extracted);
                    }
                } else {
                    const res = await getUserById(user.id);
                    if (res) {
                        const extracted = extractUserData(res);
                        setProfile(extracted);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setProfile(null);
            }
        };

        getData();
    }, [user, extractUserData]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isSearchModalOpen) {
                    handleCloseSearchModal();
                } else if (isSidebarOpen) {
                    handleCloseSidebar();
                } else if (isMenuOpen) {
                    setIsMenuOpen(false);
                }
            }
        };

        document.addEventListener("keydown", handleEscape);

        if (isMenuOpen || isSearchModalOpen || isSidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen, isSearchModalOpen, isSidebarOpen, handleCloseSearchModal, handleCloseSidebar]);

    const userRole = user?.role || 'user';

    return (
        <>
            <header className={isHome ? "header header--home" : "header"} id="header" role="banner">
                <div className="header__container">
                    <div className="header__top">
                        <LanguageSwitcher />
                        <Link to="/" className="header__logo">
                            <img src={Logo} alt={lang.logoTitle} className="header__logo-img" />
                        </Link>
                        <div className="header__icons">
                            <Link to="/search" className="header__icon-link" aria-label={lang.search}>
                                <img src={Search} alt={lang.search} className="header__icon" />
                            </Link>
                            <Link to="/likes" className="header__icon-link" aria-label={lang.likes}>
                                <img src={Like} alt={lang.likes} className="header__icon" />
                            </Link>
                            <Link to="/cart" className="header__icon-link" aria-label={lang.cart}>
                                <img src={Cart} alt={lang.cart} className="header__icon" />
                            </Link>
                            <button
                                className="header__profile-btn"
                                onClick={handleOpenSidebar}
                                aria-label={lang.profileBtn}
                            >
                                <img src={ProfileIcon} alt={lang.profileBtn} className="header__icon" />
                            </button>
                        </div>
                    </div>
                    <div className="header__bottom">
                        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`} role="navigation">
                            <ul className="header__nav-list">
                                <li className="header__nav-item">
                                    <Link to="/arts" className="header__nav-link">
                                        {lang.nav.gallery}
                                    </Link>
                                </li>
                                <li className="header__nav-item">
                                    <Link to="/authors" className="header__nav-link">
                                        {lang.nav.authors}
                                    </Link>
                                </li>
                                <li className="header__nav-item header__nav-item--services">
                                    <Link to="/services" className="header__nav-link">
                                        {lang.nav.services}
                                    </Link>
                                </li>
                                <li className="header__nav-item">
                                    <Link to="/contacts" className="header__nav-link">
                                        {lang.nav.contacts}
                                    </Link>
                                </li>
                                <li className="header__nav-item">
                                    <Link to="/about" className="header__nav-link">
                                        {lang.nav.about}
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>

            {isSidebarOpen && (
                <ProfileSidebar
                    onClose={handleCloseSidebar}
                    onNavigate={handleSidebarNavigate}
                    isClosing={isSidebarClosing}
                    userData={profile || undefined}
                    userRole={userRole}
                    isAuthenticated={!!user}
                    onTransitionEnd={handleSidebarTransitionEnd}
                />
            )}
        </>
    );
});

export default Header;