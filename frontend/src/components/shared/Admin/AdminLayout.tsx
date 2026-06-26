import { Outlet } from 'react-router-dom';
import { AdminMenu } from './AdminMenu';
import './AdminLayout.css';

export const AdminLayout = () => {
    return (
        <div className="admin-layout">
            <AdminMenu />
            <div className="admin-layout__content">
                <Outlet />
            </div>
        </div>
    );
};