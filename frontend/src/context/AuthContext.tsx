import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { logout, me, refresh, type MeResponse } from '../api/auth/main.api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './contexts';
import { detachBrowserPush } from '../utils/browser-push';
export type UserRole = 'admin' | 'moderator' | 'author' | 'user';

const CHECK_INTERVAL = 5 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const checking = useRef<Promise<void> | null>(null);
    const lastCheck = useRef(0);
    const sessionVersion = useRef(0);

    const checkAuth = useCallback(async (force = false) => {
        if (checking.current) {
            await checking.current;
            if (!force) return;
        }
        if (!force && Date.now() - lastCheck.current < CHECK_INTERVAL) return;
        const version = sessionVersion.current;
        const request = (async () => {
            let result = await me();
            if (result.status === 401) {
                const response = await refresh();
                if (response?.ok) result = await me();
            }
            if (version === sessionVersion.current) {
                if (result.success) setUser(result.data ?? null);
                else if (result.status === 401 || result.status === 403) setUser(null);
            }
            lastCheck.current = Date.now();
        })();
        checking.current = request;
        try { await request; } finally {
            if (checking.current === request) checking.current = null;
        }
    }, []);

    const refetch = useCallback(() => checkAuth(true), [checkAuth]);
    useEffect(() => {
        let active = true;
        checkAuth(true).finally(() => { if (active) setIsLoading(false); });
        const interval = setInterval(() => { void checkAuth(); }, CHECK_INTERVAL);
        const checkOnFocus = () => { void checkAuth(); };
        window.addEventListener('focus', checkOnFocus);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener('focus', checkOnFocus);
        };
    }, [checkAuth]);

    const handleLogout = useCallback(async () => {
        sessionVersion.current++;
        setIsLoading(true);
        try {
            await detachBrowserPush().catch(() => undefined);
            await logout();
        } finally {
            setUser(null);
            setIsLoading(false);
            lastCheck.current = 0;
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, refetch, logout: handleLogout, checkAuth }}>{children}</AuthContext.Provider>;
};
