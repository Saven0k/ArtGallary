import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { publicRouteTranslations } from "./lang";

interface PublicRouteProps {
    children?: React.ReactNode;
    redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
    children, 
    redirectTo = "/profile" 
}) => {
    const { isLoading, isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const lang = publicRouteTranslations[language];

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};