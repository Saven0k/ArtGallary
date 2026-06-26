import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { deleteUserById, getAllUsers } from '../../../../api/users/main.api';
import type { User } from '../../../../types/user.types';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';
import { StatusBadge } from '../components/StatusBadge';

export const UsersAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState('');

    const roles = ['user', 'artist', 'moderator', 'admin'];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const users = await getAllUsers();
            setData(users);
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await confirm({
            title: "Удаление пользователя",
            message: `Удалить пользователя "${name}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteUserById(id);
                showNotification("Пользователь удален", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const handleRoleChange = async () => {
        if (!editingUser || !selectedRole) return;
        try {
            // await updateUserRole(editingUser.id, selectedRole); TODO: делаем под чистую с ролями
            showNotification("Роль пользователя обновлена", "success");
            setModalOpen(false);
            setEditingUser(null);
            loadData();
        } catch (error) {
            showNotification("Ошибка при обновлении роли", "error");
        }
    };


    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'email', header: 'Email' },
        { key: 'name', header: 'Имя', render: (item: User) => `${item.surname} ${item.name}` },
        { key: 'role', header: 'Роль', render: (item: User) => <StatusBadge status={item.role === 'admin' ? 'active' : 'inactive'} label={item.role} /> }
    ];

    const actions = (item: User) => (
        <>
            <button className="admin-table__edit" onClick={() => { setEditingUser(item); setSelectedRole(item.role); setModalOpen(true); }}>✏️</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, `${item.surname} ${item.name}`)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>👥 Пользователи</h1>
            </div>
            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Пользователи не найдены" />
            <AdminModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingUser(null); }} title="Изменение роли" onSave={handleRoleChange} saveText="Сохранить">
                <div className="admin-form">
                    <label className="admin-form__label">Пользователь: {editingUser?.surname} {editingUser?.name}</label>
                    <select className="admin-form__select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
            </AdminModal>
        </div>
    );
};