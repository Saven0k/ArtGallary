import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";

interface StyleCreationAttrs {
    name: string
}

@Table({ tableName: 'styles' })
export class Style extends Model<Style, StyleCreationAttrs> {
    @ApiProperty({ example: 'Пейзаж', description: 'Уникальное название стиля ' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name: string;
}