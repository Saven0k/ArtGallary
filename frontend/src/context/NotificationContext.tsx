import { createContext, useContext, useState } from "react";
import { NotificationComponent } from "../components/ui/NotificationComponent/NotificationComponent";


type NotificationType = "success" | "error";

type Notification = {
    message: string;
    type: NotificationType;
};

type NotificationContextType = {
    showNotification: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = (message: string, type: NotificationType = "success") => {
        setNotification({ message, type });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && <NotificationComponent {...notification} />}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within NotificationProvider");
    return context;
};