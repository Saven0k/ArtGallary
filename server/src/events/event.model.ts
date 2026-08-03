// src/events/event.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface EventCreationAttrs {
    title: string;
    image: string;
    description: string;
}

@Table({ tableName: 'events' })
export class Event extends Model<Event, EventCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID события' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 'Художница Тилинина Маргарита создала новую коллекцию картин', description: 'Название события' })
    @Column({ type: DataType.STRING, allowNull: false })
    title: string;

    @ApiProperty({ example: '/images/event.jpg', description: 'Путь к картинке' })
    @Column({ type: DataType.STRING, allowNull: false })
    image: string;

    @ApiProperty({ example: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность...', description: 'Описание события' })
    @Column({ type: DataType.TEXT, allowNull: false })
    description: string;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата создания' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата обновления' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    updated_at: Date;
}