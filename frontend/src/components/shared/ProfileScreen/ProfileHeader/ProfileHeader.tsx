import { Crown } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { profileTranslations } from "../lang";
import "./ProfileHeader.css";

interface ProfileHeaderProps {
    avatar: string;
    name: string;
    role: string;
    plan: string;
}

const ProfileHeader = ({
    avatar,
    name,
    role,
    plan,
}: ProfileHeaderProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].header;

    return (
        <div className="profile-header">
            <div className="profile-header__avatar">
                {avatar ? (
                    <img src={avatar} alt={name} />
                ) : (
                    <div className="profile-header__placeholder">{name.charAt(0)}</div>
                )}
            </div>

            <div className="profile-header__content">
                <div className="profile-header__badge">
                    <Crown size={12} strokeWidth={2.2} />
                    <span>{plan}</span>
                </div>

                <h2 className="profile-header__name">{name}</h2>
                <p className="profile-header__role">{role}</p>
            </div>
        </div>
    );
};

export default ProfileHeader;