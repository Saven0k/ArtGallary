import React from 'react';


type UserProfile = {
    name: string;
    surname: string;
    avatar_path: string;
};

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
                <button onClick={handleEdit} className="sidebarProfile__avatar">
                    +
                </button>
            )}
            <div className="sidebarProfile__user-details">
                <h2 className="sidebarProfile__user-name">{name}</h2>
                <p className="sidebarProfile__user-email">{surname}</p>
            </div>
        </div>
    );
};