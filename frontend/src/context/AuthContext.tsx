import { createContext, useEffect, useState, useRef, useCallback, type FC } from "react";
import type { User } from "../types/user.types";
import { logout, me, refresh } from "../api/auth/main.api";
import { useNavigate } from "react-router-dom";
import { guestStorage } from "../services/guest.service";

export const AuthContext = createContext<{
    user: User | null,
    isLoading: boolean,
    isAuthenticated: boolean,
    isGuestRef: boolean,
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
} | null>(null);

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isGuestRef = useRef<boolean>(false);
    const navigate = useNavigate();
    const isCheckingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCheckTimeRef = useRef<number>(0);
    const MIN_CHECK_INTERVAL = 5 * 60 * 1000;

    useEffect(() => {
        const checkGuest = async () => {
            setIsLoading(true);
            const guest = guestStorage.isGuest();
            if (guest) {
                isGuestRef.current = true;
                setIsAuthenticated(false);
                setUser(null);
            } else {
                isGuestRef.current = false;
                setIsAuthenticated(false);
                setUser(null);
                checkAuth();
            }
            setIsLoading(false);
        };
        checkGuest();
    }, []);

    const checkAuth = useCallback(async (force: boolean = false) => {

        if (isGuestRef.current) return;
        const now = Date.now();
        if (!force && (now - lastCheckTimeRef.current) < MIN_CHECK_INTERVAL) return;
        if (isCheckingRef.current) return;

        isCheckingRef.current = true;
        lastCheckTimeRef.current = now;
        try {
            const res = await me();
            if (res?.success) {
                setUser(res.data);
                setIsAuthenticated(true);
                return;
            }
            if (res?.status === 401) {
                const refreshRes = await refresh();

                if (refreshRes.ok) {
                    const retryRes = await me();
                    if (retryRes?.success) {
                        setUser(retryRes.data);
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
    }, [navigate, isGuestRef]);
    const refetch = useCallback(async () => {
        if (isGuestRef) return;
        await checkAuth(true);
    }, [checkAuth, isGuestRef]);
    useEffect(() => {

        const initAuth = async () => {
            if (isGuestRef) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            await checkAuth(true);
            setIsLoading(false);
        };
        initAuth();
    }, [checkAuth, isGuestRef]);
    useEffect(() => {
        if (isGuestRef) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        }
        intervalRef.current = setInterval(() => {
            checkAuth(false);
        }, 10 * 60 * 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkAuth, isGuestRef]);

    useEffect(() => {
        if (isGuestRef) return;
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
    }, [checkAuth, isGuestRef]);

    const handleLogout = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            if (guestStorage.isGuest()) {
                guestStorage.clearGuest();
                isGuestRef.current = false;
            }
            if (isGuestRef.current) {
                guestStorage.clearGuest();
                isGuestRef.current = false;
                setUser(null);
                setIsAuthenticated(false);
                navigate("/login");
                return;
            }
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
            if (isGuestRef.current) {
                guestStorage.clearGuest();
                isGuestRef.current = false;
            }
            navigate("/login", { replace: true });
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        isGuestRef: isGuestRef.current,
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