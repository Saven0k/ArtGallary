import React from 'react';
import { UserRound } from 'lucide-react';
import type { UserDataForSidebar } from '../ProfileSidebar';

interface UserHeaderProps {
    userData: UserDataForSidebar;
    onEdit: () => void;
    onClose: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ userData }) => {
    const { name, surname, avatar_path } = userData;


    const initials = `${name?.[0] ?? ''}${surname?.[0] ?? ''}`;

    return (
        <div className="sidebarProfile__user-info">
            {avatar_path ? (
                <img
                    src={avatar_path}
                    alt={`${name} ${surname}`}
                    className="sidebarProfile__avatar"
                    width={48}
                    height={48}
                    loading="lazy"
                />
            ) : (
                <div className="sidebarProfile__avatar sidebarProfile__avatar--placeholder">
                    {initials || <UserRound size={22} aria-hidden="true" />}
                </div>
            )}
            <div className="sidebarProfile__user-details">
                <h2 className="sidebarProfile__user-name">{name} {surname}</h2>
            </div>
        </div>
    );
};
