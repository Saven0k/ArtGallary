import "./ProfileInput.css";

interface ProfileInputProps {
    label: string;
    error?: string;
    className?: string;
}

const ProfileInput = ({
    label,
    error,
    className = "",
    ...props
}: ProfileInputProps) => {
    return (
        <div className="profile-input">

            <label className="profile-input__label">
                {label}
            </label>

            <input
                className={`profile-input__field ${
                    error ? "profile-input__field--error" : ""
                } ${className}`}
                {...props}
            />

            {error && (
                <span className="profile-input__error">
                    {error}
                </span>
            )}

        </div>
    );
};

export default ProfileInput;