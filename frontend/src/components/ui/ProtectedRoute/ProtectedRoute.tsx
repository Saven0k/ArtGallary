import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { protectedRouteTranslations } from "./lang";

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRoles?: Array<'admin' | 'moderator' | 'author' | 'visitor' | 'user'>;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles = [],
    redirectTo = "/login"
}) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const lang = protectedRouteTranslations[language];
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location.pathname + location.search }} replace />;
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/profile" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
