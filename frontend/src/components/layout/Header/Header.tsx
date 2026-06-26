import { memo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import ProfileSidebar from "../ProfileSidebar/ProfileSidebar";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { headerTranslations } from "./lang";
import "./Header.css";

const Header = memo(() => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarClosing, setIsSidebarClosing] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    
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

    return (
        <>
            <header className="header" id="header" role="banner">
                <div className="header__left">
                    <Link to="/" className="header__logo">
                        <div className="header__logo-icon" aria-hidden="true">
                            🎨
                        </div>
                        <div className="header__logo-text">
                            <span className="header__logo-title">{lang.logoTitle}</span>
                            <span className="header__logo-subtitle">{lang.logoSubtitle}</span>
                        </div>
                    </Link>
                </div>
                <nav className="header__nav" role="navigation">
                    <ul className="header__nav-list">
                        <li className="header__nav-item">
                            <Link to="/arts" className="header__nav-link">
                                {lang.nav.gallery}
                            </Link>
                        </li>
                        <li className="header__nav-item">
                            <Link to="/artists" className="header__nav-link">
                                {lang.nav.artists}
                            </Link>
                        </li>
                        <li className="header__nav-item">
                            <Link to="/exhibitions" className="header__nav-link">
                                {lang.nav.exhibitions}
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="header__right">
                    <button
                        className="header__profile-btn"
                        onClick={handleOpenSidebar}
                        aria-label={lang.profileBtn}
                    >
                        <span className="header__profile-icon">👤</span>
                    </button>
                </div>
            </header>

            {isSidebarOpen && (
                <ProfileSidebar
                    onClose={handleCloseSidebar}
                    onNavigate={handleSidebarNavigate}
                    isClosing={isSidebarClosing}
                    userRole={user?.role}
                    onTransitionEnd={handleSidebarTransitionEnd}
                />
            )}
        </>
    );
});

export default Header;