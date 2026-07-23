import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Genre } from "../genres/genre.model";

interface ArtTypeCreationAttrs {
    name: string;
    description?: string;
}

@Table({ tableName: 'art_types' })
export class ArtType extends Model<ArtType, ArtTypeCreationAttrs> {
    @ApiProperty({ example: 'Живопись', description: 'Название вида искусства' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name: string;

    @ApiProperty({ example: 'Искусство создания изображений с помощью красок', description: 'Описание вида искусства' })
    @Column({ type: DataType.TEXT, allowNull: true })
    description: string;


    // , {
    //     onDelete: 'CASCADE'
    // }

    @HasMany(() => Genre)
    genres: Genre[];
}