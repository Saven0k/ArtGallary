import { useState } from 'react';
import { KeyRound, Mail, Trash2 } from 'lucide-react';
import { profileTranslations } from '../../lang';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useNotification } from '../../../../../hooks/useNotification';
import { useAuth } from '../../../../../hooks/useAuth';
import CodeModal from '../../../../../components/layout/CodeModal/CodeModal';
import ChangePasswordModal from '../../ChangePasswordModal/ChangePasswordModal';
import ChangeEmailModal from '../../ChangeEmailModal/ChangeEmailModal';
import DeleteAccountModal from '../../DeleteAccountModal/DeleteAccountModal';
import { deleteAuthor } from '../../../../../api/authors/main.api';
import { deleteUser } from '../../../../../api/users/main.api';
import './Settings.scss';

interface SettingsProps {
    id: number;
    role: string;
}

type PasswordStage = 'idle' | 'code' | 'password';

const Settings = ({ id, role }: SettingsProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].settings;
    const n = t.notifications;
    const { showNotification } = useNotification();
    const { logout } = useAuth();

    const [passwordStage, setPasswordStage] = useState<PasswordStage>('idle');
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [openChangeEmail, setOpenChangeEmail] = useState(false);
    const [openDeleteAccount, setOpenDeleteAccount] = useState(false);

    const openPasswordFlow = () => setPasswordStage('code');

    const closePasswordFlow = () => {
        setResetToken(null);
        setPasswordStage('idle');
    };

    const handleDeleteAccount = async () => {
        try {
            if (role === 'author') {
                await deleteAuthor(id);
            } else {
                await deleteUser(id);
            }
            showNotification(n.accountDeleted, 'success');
            // Выход из аккаунта + редирект на /
            await logout();
        } catch (err) {
            console.error('delete account error:', err);
            showNotification(n.accountDeleteFailed, 'error');
            throw err;   // чтобы модалка показала ошибку
        }
    };

    const items = [
        { icon: <KeyRound size={22} />, title: t.items[0].title, description: t.items[0].description, onClick: openPasswordFlow },
        { icon: <Mail size={22} />, title: t.items[1].title, description: t.items[1].description, onClick: () => setOpenChangeEmail(true) },
        { icon: <Trash2 size={22} />, title: t.items[2].title, description: t.items[2].description, danger: true, onClick: () => setOpenDeleteAccount(true) },
    ];

    return (
        <section className="profile-settings">
            <header className="profile-settings__header">
                <h2 className="profile-settings__title">{t.title}</h2>
                <p className="profile-settings__subtitle">{t.subtitle}</p>
            </header>

            <div className="profile-settings__list">
                {items.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`profile-settings__item ${item.danger ? 'profile-settings__item--danger' : ''
                            }`}
                        onClick={item.onClick}
                    >
                        <div
                            className={`profile-settings__icon ${item.danger ? 'profile-settings__icon--danger' : ''
                                }`}
                        >
                            {item.icon}
                        </div>
                        <div className="profile-settings__content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            {passwordStage === 'code' && (
                <CodeModal
                    onVerified={({ resetToken }) => {
                        setResetToken(resetToken);
                        setPasswordStage('password');
                    }}
                    onClose={closePasswordFlow}
                />
            )}

            {passwordStage === 'password' && resetToken && (
                <ChangePasswordModal
                    resetToken={resetToken}
                    onClose={closePasswordFlow}
                    onSuccess={() => {
                        showNotification(n.passwordChanged, 'success');
                        closePasswordFlow();
                    }}
                    onError={() => {
                        showNotification(n.passwordChangeFailed, 'error');
                    }}
                />
            )}

            {openChangeEmail && (
                <ChangeEmailModal
                    onClose={() => setOpenChangeEmail(false)}
                    onSuccess={() => {
                        showNotification(n.emailChanged, 'success');
                        setOpenChangeEmail(false);
                    }}
                    onError={() => {
                        showNotification(n.emailChangeFailed, 'error');
                    }}
                />
            )}

            {openDeleteAccount && (
                <DeleteAccountModal
                    onConfirm={handleDeleteAccount}
                    onClose={() => setOpenDeleteAccount(false)}
                />
            )}
        </section>
    );
};

export default Settings;