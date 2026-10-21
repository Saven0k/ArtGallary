import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSiteVisit } from '../api/site/main.api';
import { useAuth } from './useAuth';

export const useSiteVisits = () => {
    const { pathname } = useLocation();
    const { isLoading } = useAuth();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading || lastPath.current === pathname) return;
        const timer = setTimeout(() => {
            lastPath.current = pathname;
            void trackSiteVisit(pathname.slice(0, 255));
        }, 0);
        return () => clearTimeout(timer);
    }, [pathname, isLoading]);
};
