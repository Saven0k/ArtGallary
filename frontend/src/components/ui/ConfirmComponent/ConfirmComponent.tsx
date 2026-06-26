import "./index.css";

type ConfirmComponentProps = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
    
};

export const ConfirmComponent = ({
    title,
    message,
    confirmText = "Да",
    cancelText = "Нет",
    type = "danger",
    onConfirm,
    onCancel,
}: ConfirmComponentProps) => {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className={`confirm-icon confirm-icon--${type}`}>
                    {type === "danger" && "⚠️"}
                    {type === "warning" && "❗"}
                    {type === "info" && "ℹ️"}
                </div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-buttons">
                    <button className="confirm-button confirm-button--cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`confirm-button confirm-button--${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};