// src/components/shared/Admin/DataTable/DataTable.tsx
import type { ReactNode } from 'react';
import './DataTable.scss';

export interface Column<T> {
    key: string;
    title: string;
    render?: (row: T) => ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    loading?: boolean;
    emptyText?: string;
    rowKey?: (row: T) => string | number;
    onRowClick?: (row: T) => void;
}

function DataTable<T>({
    columns,
    rows,
    loading,
    emptyText = '—',
    rowKey,
    onRowClick,
}: DataTableProps<T>) {
    if (loading) {
        return <div className="data-table__state">…</div>;
    }

    if (!rows.length) {
        return <div className="data-table__state">{emptyText}</div>;
    }

    return (
        <div className="data-table">
            <table className="data-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{
                                    width: col.width,
                                    textAlign: col.align ?? 'left',
                                }}
                            >
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={rowKey ? rowKey(row) : i}
                            className={onRowClick ? 'data-table__row--clickable' : ''}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    style={{ textAlign: col.align ?? 'left' }}
                                >
                                    {col.render
                                        ? col.render(row)
                                        : String((row as any)[col.key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;