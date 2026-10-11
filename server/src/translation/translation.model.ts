import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'content_translations', timestamps: false })
export class ContentTranslation extends Model {
  @Column({ type: DataType.STRING(64), primaryKey: true })
  declare key: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare source_text: string;

  @Column({ type: DataType.STRING(2), allowNull: false })
  declare source_language: string;

  @Column({ type: DataType.STRING(2), allowNull: false })
  declare target_language: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare model: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare translated_text: string;
}
