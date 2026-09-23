// src/site/models/site-rating.model.ts
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

export interface SiteRatingCreationAttrs {
    user_id: number;
    value: number;
}

@Table({
    tableName: 'site_ratings',
    timestamps: true, // createdAt/updatedAt пригодятся
    indexes: [{ fields: ['user_id'], unique: true }],
})
export class SiteRating extends Model<SiteRating, SiteRatingCreationAttrs> {
    @ApiProperty({ example: 1 })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 6 })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
    user_id: number;

    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    user: User;

    @ApiProperty({ example: 5, description: 'Оценка от 1 до 5' })
    @Column({ type: DataType.INTEGER, allowNull: false })
    value: number;
}