// src/site/models/site-visit.model.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { User } from '../../users/users.model';

export interface SiteVisitCreationAttrs {
    user_id?: number | null;
    ip?: string | null;
    user_agent?: string | null;
    path?: string | null;
}

@Table({
    tableName: 'site_visits',
    timestamps: false, // храним только created_at вручную
    indexes: [
        { fields: ['created_at'] },
        { fields: ['user_id'] },
    ],
})
export class SiteVisit extends Model<SiteVisit, SiteVisitCreationAttrs> {
    @ApiProperty({ example: 1 })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 6, nullable: true })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true })
    user_id: number | null;

    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    user: User;

    @ApiProperty({ example: '192.168.0.1', nullable: true })
    @Column({ type: DataType.STRING, allowNull: true })
    ip: string | null;

    @ApiProperty({ example: 'Mozilla/5.0…', nullable: true })
    @Column({ type: DataType.TEXT, allowNull: true })
    user_agent: string | null;

    @ApiProperty({ example: '/', nullable: true })
    @Column({ type: DataType.STRING, allowNull: true })
    path: string | null;

    @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;
}