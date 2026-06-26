import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { protectedRouteTranslations } from "./lang";

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRoles?: Array<'admin' | 'moderator' | 'artist' | 'visitor' | 'user'>;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles = [],
    redirectTo = "/"
}) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const lang = protectedRouteTranslations[language];
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [timerDone, setTimerDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimerDone(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (timerDone && !isLoading) {
            if (!isAuthenticated) {
                setShouldRedirect(true);
            }
        }
    }, [timerDone, isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (!timerDone && !isAuthenticated) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>{lang.checkingAuth}</p>
            </div>
        );
    }

    if (shouldRedirect || (!isAuthenticated && timerDone)) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/profile" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};