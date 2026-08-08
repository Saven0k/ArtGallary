import { ChevronDown } from "lucide-react";
import "./ProfileSelect.scss";

interface ProfileSelectProps {
    label: string;
    error?: string;
    options: {
        value: string;
        label: string;
    }[];
    className?: string;
}

const ProfileSelect = ({
    label,
    error,
    options,
    className = "",
    ...props
}: ProfileSelectProps) => {
    return (
        <div className="profile-select">
            <label className="profile-select__label">{label}</label>

            <div className="profile-select__wrapper">
                <select
                    className={`profile-select__field ${error ? "profile-select__field--error" : ""} ${className}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={18} className="profile-select__icon" />
            </div>

            {error && <span className="profile-select__error">{error}</span>}
        </div>
    );
};

export default ProfileSelect;