// AdminTable.tsx
import './AdminTable.css';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface AdminTableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: (item: T) => React.ReactNode;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export const AdminTable = <T extends { id: number }>({
    data,
    columns,
    actions,
    onRowClick,
    emptyMessage = "Нет данных"
}: AdminTableProps<T>) => {
    if (data.length === 0) {
        return (
            <div className="admin-table__empty">
                <div className="admin-table__empty-icon">📭</div>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="admin-table__wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={col.key || index} className={col.className}>
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="admin-table__actions-header">Действия</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick?.(item)}
                            className={onRowClick ? 'admin-table__row--clickable' : ''}
                        >
                            {columns.map((col, index) => (
                                <td key={col.key || index} className={col.className}>
                                    {col.render ? col.render(item) : (item as any)[col.key]}
                                </td>
                            ))}
                            {actions && (
                                <td className="admin-table__actions" onClick={(e) => e.stopPropagation()}>
                                    {actions(item)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};