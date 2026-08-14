import { createContext, useEffect, useState, useRef, useCallback, type FC } from "react";
import { logout, me, refresh, type MeResponse } from "../api/auth/main.api";
import { useNavigate } from "react-router-dom";

export type UserRole = 'admin' | 'moderator' | 'author' | 'user' ;


export const AuthContext = createContext<{
    user: MeResponse | null,
    isLoading: boolean,
    isAuthenticated: boolean,
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
} | null>(null);

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const isCheckingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCheckTimeRef = useRef<number>(0);
    const MIN_CHECK_INTERVAL = 5 * 60 * 1000;

    const checkAuth = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && (now - lastCheckTimeRef.current) < MIN_CHECK_INTERVAL) return;
        if (isCheckingRef.current) return;

        isCheckingRef.current = true;
        lastCheckTimeRef.current = now;
        try {
            const res = await me();
            if (res?.success) {
                setUser(res.data ? res.data : null);
                setIsAuthenticated(true);
                return;
            }
            if (res?.status === 401) {
                const refreshRes = await refresh();

                if (refreshRes?.ok) {
                    const retryRes = await me();
                    if (retryRes?.success) {
                        setUser(retryRes.data ? retryRes.data : null);
                        setIsAuthenticated(true);
                        return;
                    }
                }
                setUser(null);
                setIsAuthenticated(false);
            } else if (!res?.success) {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            isCheckingRef.current = false;
        }
    }, [navigate]);
    const refetch = useCallback(async () => {
        await checkAuth(true);
    }, [checkAuth]);
    useEffect(() => {

        const initAuth = async () => {

            setIsLoading(true);
            await checkAuth(true);
            setIsLoading(false);
        };
        initAuth();
    }, [checkAuth]);
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            checkAuth(false);
        }, 10 * 60 * 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkAuth]);

    useEffect(() => {
        let activityTimeout: ReturnType<typeof setTimeout>;
        const resetActivityTimer = () => {
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }
            activityTimeout = setTimeout(() => {
                checkAuth(false);
            }, 5 * 60 * 1000);
        };
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(event => {
            window.addEventListener(event, resetActivityTimer);
        });
        resetActivityTimer();
        return () => {
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetActivityTimer);
            });
        };
    }, [checkAuth]);

    const handleLogout = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            await logout();
            setUser(null);
            setIsAuthenticated(false);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            navigate("/login", { replace: true });
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            navigate("/login", { replace: true });
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        refetch,
        logout: handleLogout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};