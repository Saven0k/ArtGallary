import { Outlet, NavLink } from 'react-router-dom';
import './ModeratorLayout.css';

const moderatorMenuItems = [
    { path: '/moderation/arts', icon: '🖼️', label: 'Модерация картин' },
    { path: '/moderation/exhibitions', icon: '🏛️', label: 'Модерация выставок' },
    { path: '/moderation/artists', icon: '👨‍🎨', label: 'Модерация артистов' },
];

export const ModeratorLayout = () => {
    return (
        <div className="moderator-layout">
            <div className="moderator-layout__sidebar">
                <div className="moderator-layout__header">
                    <h2>🛡️ Модерация</h2>
                </div>
                <nav className="moderator-layout__nav">
                    {moderatorMenuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => 
                                `moderator-layout__link ${isActive ? 'moderator-layout__link--active' : ''}`
                            }
                        >
                            <span className="moderator-layout__icon">{item.icon}</span>
                            <span className="moderator-layout__label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="moderator-layout__content">
                <Outlet />
            </div>
        </div>
    );
};