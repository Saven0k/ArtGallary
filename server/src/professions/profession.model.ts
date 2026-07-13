import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface ProfessionCreationAttrs {
    name: string;
    description?: string;
}

@Table({ tableName: 'professions' })
export class Profession extends Model<Profession, ProfessionCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID профессии' })
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id: number;

    @ApiProperty({ example: 'Photographer', description: 'Название профессии' })
    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    name: string;

    @ApiProperty({ example: 'Профессиональный фотограф', description: 'Описание профессии' })
    @Column({ type: DataType.TEXT, allowNull: true })
    description: string;
}