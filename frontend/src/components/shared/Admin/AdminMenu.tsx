import { NavLink } from 'react-router-dom';
import './AdminMenu.css';

const menuItems = [
    {
        title: 'Справочники',
        items: [
            { path: '/admin/cities', icon: '🏙️', label: 'Города' },
            { path: '/admin/countries', icon: '🌍', label: 'Страны' },
            { path: '/admin/genres', icon: '🎨', label: 'Жанры' },
            { path: '/admin/types', icon: '🏷️', label: 'Типы' },
        ]
    },
    {
        title: 'Пользователи',
        items: [
            { path: '/admin/users', icon: '👥', label: 'Пользователи' },
            { path: '/admin/moderators', icon: '🛡️', label: 'Модераторы' },
        ]
    },
    {
        title: 'Контент',
        items: [
            { path: '/admin/arts', icon: '🖼️', label: 'Картины' },
            { path: '/admin/exhibitions', icon: '🏛️', label: 'Выставки' },
            { path: '/admin/artists', icon: '👨‍🎨', label: 'Художники' },
        ]
    }
];

export const AdminMenu = () => {
    return (
        <div className="admin-menu">
            <div className="admin-menu__header">
                <h2>⚙️ Админ панель</h2>
            </div>
            <nav className="admin-menu__nav">
                {menuItems.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="admin-menu__section">
                        <div className="admin-menu__section-title">{section.title}</div>
                        {section.items.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `admin-menu__link ${isActive ? 'admin-menu__link--active' : ''}`
                                }
                            >
                                <span className="admin-menu__icon">{item.icon}</span>
                                <span className="admin-menu__label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
        </div>
    );
};