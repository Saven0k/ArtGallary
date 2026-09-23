// src/cart/cart.model.ts
import { ApiProperty } from "@nestjs/swagger";
import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from "sequelize-typescript";
import { User } from "../users/users.model";

export interface CartCreationAttrs {
    user_id: number;
    art_ids?: number[];
}

@Table({ tableName: "carts" })
export class Cart extends Model<Cart, CartCreationAttrs> {
    @ApiProperty({ example: 1, description: "ID пользователя (владелец корзины)" })
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
    })
    user_id: number;

    @BelongsTo(() => User, { foreignKey: "user_id", as: "user" })
    user: User;

    @ApiProperty({
        example: [12, 15, 33],
        description: "Массив ID картин в корзине",
        type: [Number],
    })
    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    })
    art_ids: number[];
}