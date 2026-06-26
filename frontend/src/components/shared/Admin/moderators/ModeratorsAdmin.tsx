import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { getAllModerators, createModerator, deleteModerator, type Moderator, type CreateModeratorData } from '../../../../api/moderators/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';
import { useAuth } from '../../../../hooks/useAuth';

export const ModeratorsAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const [moderators, setModerators] = useState<Moderator[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateModeratorData>({
        email: '',
        password: '',
        name: '',
        surname: '',
        second_name: '',
        phone_number: '',
        avatar_path: null
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const moderatorsData = await getAllModerators();
            setModerators(moderatorsData?.data || []);
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.email || !formData.password || !formData.name || !formData.surname || !formData.phone_number) {
            showNotification("Заполните все обязательные поля", "error");
            return;
        }

        try {
            const submitData = {
                ...formData,
                avatar_path: avatarFile
            };
            const result = await createModerator(submitData);
            if (result) {
                showNotification("Модератор успешно создан", "success");
                setModalOpen(false);
                setFormData({
                    email: '',
                    password: '',
                    name: '',
                    surname: '',
                    second_name: '',
                    phone_number: '',
                    avatar_path: null
                });
                setAvatarFile(null);
                setAvatarPreview(null);
                loadData();
            } else {
                showNotification("Ошибка при создании модератора", "error");
            }
        } catch (error) {
            showNotification("Ошибка при создании модератора", "error");
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await confirm({
            title: "Удаление модератора",
            message: `Вы уверены, что хотите удалить модератора "${name}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                const result = await deleteModerator(id);
                if (result) {
                    showNotification("Модератор удален", "success");
                    loadData();
                } else {
                    showNotification("Ошибка при удалении", "error");
                }
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'user', header: 'Email', render: (item: Moderator) => item.user?.email || '-' },
        { key: 'user', header: 'Имя', render: (item: Moderator) => item.user ? `${item.user.surname} ${item.user.name}` : '-' },
        { key: 'user', header: 'Телефон', render: (item: Moderator) => item.user?.phone_number || '-' },
        { key: 'assigned_by', header: 'Кем назначен', render: (item: Moderator) => item.assigned_by || '-' }
    ];

    const actions = (item: Moderator) => (
        <button className="admin-table__delete" onClick={() => handleDelete(item.id, `${item.user?.surname} ${item.user?.name}`)}>
            🗑️ Удалить
        </button>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>🛡️ Управление модераторами</h1>
                <button className="admin-page__add-btn" onClick={() => setModalOpen(true)}>
                    + Создать модератора
                </button>
            </div>
            
            <AdminTable 
                data={moderators} 
                columns={columns} 
                actions={actions} 
                emptyMessage="Модераторы не найдены" 
            />

            <AdminModal 
                isOpen={modalOpen} 
                onClose={() => { 
                    setModalOpen(false); 
                    setFormData({ email: '', password: '', name: '', surname: '', second_name: '', phone_number: '', avatar_path: null });
                    setAvatarFile(null);
                    setAvatarPreview(null);
                }} 
                title="Создать модератора" 
                onSave={handleCreate} 
                saveText="Создать"
            >
                <div className="admin-form">
                    <div className="admin-form__field">
                        <label className="admin-form__label">Аватар</label>
                        <div className="admin-form__avatar">
                            {avatarPreview && (
                                <div className="admin-form__avatar-preview">
                                    <img src={avatarPreview} alt="Avatar preview" />
                                    <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}>✕</button>
                                </div>
                            )}
                            <label className="admin-form__avatar-label">
                                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                <span>{avatarPreview ? 'Изменить' : 'Выбрать фото'}</span>
                            </label>
                        </div>
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Email *</label>
                        <input 
                            type="email" 
                            className="admin-form__input" 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                        />
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Пароль *</label>
                        <input 
                            type="password" 
                            className="admin-form__input" 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Минимум 6 символов"
                        />
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Имя *</label>
                        <input 
                            type="text" 
                            className="admin-form__input" 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Имя"
                        />
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Фамилия *</label>
                        <input 
                            type="text" 
                            className="admin-form__input" 
                            value={formData.surname} 
                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                            placeholder="Фамилия"
                        />
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Отчество</label>
                        <input 
                            type="text" 
                            className="admin-form__input" 
                            value={formData.second_name || ''} 
                            onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                            placeholder="Отчество (необязательно)"
                        />
                    </div>

                    <div className="admin-form__field">
                        <label className="admin-form__label">Телефон *</label>
                        <input 
                            type="tel" 
                            className="admin-form__input" 
                            value={formData.phone_number} 
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            placeholder="+79999999999"
                        />
                    </div>
                </div>
            </AdminModal>
        </div>
    );
};