// src/components/shared/ProfileScreen/ProfileHeader/ProfileHeader.tsx
import { Crown } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import {
    useProfileHeaderTranslation,
    getProfessionLabel,
    getPlanLabel,
} from './lang';
import './ProfileHeader.scss';

interface ProfileHeaderProps {
    avatar: string;
    name: string;
    role: string;
    /** Ключ плана с бэка: 'free' | 'pro' | 'vip' */
    plan: string;
    /** Название профессии на русском (как в БД). Только для авторов. */
    professionName?: string | null;
}

const ProfileHeader = ({
    avatar,
    name,
    role,
    plan,
    professionName,
}: ProfileHeaderProps) => {
    const { language } = useLanguage();
    const { t } = useProfileHeaderTranslation(language);

    const roleLabel =
        role === 'author'
            ? professionName
                ? getProfessionLabel(language, professionName)
                : role
            : t.roleUser;

    const planLabel = getPlanLabel(language, plan);

    return (
        <div className="profile-header">
            <div className="profile-header__avatar">
                {avatar ? (
                    <img src={avatar} alt={name} />
                ) : (
                    <div className="profile-header__placeholder">
                        {name.charAt(0)}
                    </div>
                )}
            </div>

            <div className="profile-header__content">
                <div className="profile-header__badge">
                    <Crown size={12} strokeWidth={2.2} />
                    <span>{planLabel}</span>
                </div>

                <h2 className="profile-header__name">{name}</h2>
                <p className="profile-header__role">{roleLabel}</p>
            </div>
        </div>
    );
};

export default ProfileHeader;