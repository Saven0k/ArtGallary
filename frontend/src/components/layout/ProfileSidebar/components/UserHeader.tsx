// src/components/ProfileSideBar/components/UserHeader.tsx
import React from 'react';

interface UserProfile {
    name: string;
    surname: string;
    avatar_path?: string | null;
}

interface UserHeaderProps {
    userData: UserProfile;
    onEdit: () => void;
    onClose: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ userData, onEdit, onClose }) => {
    const { name, surname, avatar_path } = userData;

    const handleEdit = () => {
        onEdit();
        onClose();
    };

    const initials = name && surname ? `${name[0]}${surname[0]}` : '👤';

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
                    {initials}
                </div>
            )}
            <div className="sidebarProfile__user-details">
                <h2 className="sidebarProfile__user-name">{name} {surname}</h2>
                <button
                    className="sidebarProfile__user-edit"
                    onClick={handleEdit}
                >
                    ✏️ Редактировать
                </button>
            </div>
        </div>
    );
};