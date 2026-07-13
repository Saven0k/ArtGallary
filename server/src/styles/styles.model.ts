import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table } from "sequelize-typescript";

interface StyleCreationAttrs {
    name: string;
    description?: string;
}

@Table({ tableName: 'styles' })
export class Style extends Model<Style, StyleCreationAttrs> {
    @ApiProperty({ example: 'Импрессионизм', description: 'Уникальное название стиля' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name: string;

    @ApiProperty({ example: 'Направление в искусстве, характеризующееся передачей мимолетных впечатлений', description: 'Описание стиля', required: false })
    @Column({ type: DataType.TEXT, allowNull: true })
    description?: string;
}