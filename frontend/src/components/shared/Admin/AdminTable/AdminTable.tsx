// src/components/admin/AdminTable/AdminTable.tsx
import './AdminTable.scss';

interface Column {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
}

interface AdminTableProps {
    columns: Column[];
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
    title: string;
    addLabel?: string;
    loading?: boolean;
}

const AdminTable = ({ 
    columns, 
    data, 
    onEdit, 
    onDelete, 
    onAdd, 
    title, 
    addLabel = 'Добавить',
    loading = false 
}: AdminTableProps) => {
    return (
        <div className="admin-table">
            <div className="admin-table__header">
                <h2 className="admin-table__title">{title}</h2>
                <button className="admin-table__add-btn" onClick={onAdd}>
                    + {addLabel}
                </button>
            </div>

            {loading ? (
                <div className="admin-table__loading">Загрузка...</div>
            ) : data.length === 0 ? (
                <div className="admin-table__empty">Нет данных</div>
            ) : (
                <div className="admin-table__wrapper">
                    <table className="admin-table__table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render ? col.render(item[col.key], item) : item[col.key]}
                                        </td>
                                    ))}
                                    <td className="admin-table__actions">
                                        <button className="admin-table__edit-btn" onClick={() => onEdit(item)}>✎</button>
                                        <button className="admin-table__delete-btn" onClick={() => onDelete(item.id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminTable;