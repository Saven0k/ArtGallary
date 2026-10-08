import { useCallback, useRef, useEffect, useState } from "react";
import { NotificationComponent } from "../components/ui/NotificationComponent/NotificationComponent";


import { NotificationContext, type NotificationType } from './contexts';
type Notification = { message: string; type: NotificationType };

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    const showNotification = useCallback((message: string, type: NotificationType = "success") => {
        if (timer.current) clearTimeout(timer.current);
        setNotification({ message, type });

        timer.current = setTimeout(() => {
            setNotification(null);
        }, 3000);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && <NotificationComponent {...notification} />}
        </NotificationContext.Provider>
    );
};
