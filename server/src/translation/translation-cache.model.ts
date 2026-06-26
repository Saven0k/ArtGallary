import { Table, Column, Model, DataType, PrimaryKey, Index } from 'sequelize-typescript';

@Table({ 
    tableName: 'translation_cache',
    paranoid: true,
    indexes: [
        { unique: true, fields: ['entity_type', 'entity_id', 'language_code'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['language_code'] }
    ]
})
export class TranslationCache extends Model<TranslationCache> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, autoIncrement: true })
    id: number;

    @Column({ type: DataType.STRING(50), allowNull: false })
    entity_type: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    entity_id: number;

    @Column({ type: DataType.STRING(5), allowNull: false })
    language_code: string;

    @Column({ type: DataType.JSONB, allowNull: false })
    data: Record<string, any>;

    @Column({ type: DataType.STRING(5), allowNull: true })
    source_language: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    is_machine_translated: boolean;

    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    translated_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    cached_until: Date;
}