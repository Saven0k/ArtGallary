import type { AdminSectionConfig, AdminSectionId } from '../../../../pages/admin/lang';
import './AdminSidebar.scss';

interface AdminSidebarProps {
    sections: AdminSectionConfig[];
    active: AdminSectionId;
    onChange: (section: AdminSectionId) => void;
    title: string;
    labels: Record<string, string>;
}

const AdminSidebar = ({
    sections,
    active,
    onChange,
    title,
    labels,
}: AdminSidebarProps) => {
    return (
        <aside className="admin-sidebar">
            <h1 className="admin-sidebar__title">{title}</h1>

            <nav className="admin-sidebar__nav">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        className={`admin-sidebar__item ${
                            active === section.id ? 'admin-sidebar__item--active' : ''
                        }`}
                        onClick={() => onChange(section.id)}
                    >
                        {labels[section.translationKey] ?? section.id}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default AdminSidebar;