import "./NotlificationComponent.css";
export const NotificationComponent = ({ message, type }: { message: string; type: "success" | "error" }) => {
    return (
        <div className={`notification notification--${type}`}>
            {message}
        </div>
    );
};