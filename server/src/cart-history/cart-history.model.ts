// src/cart-history/cart-history.model.ts
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

export type OrderStatus = "delivered" | "in_transit" | "cancelled";

export interface CartHistoryCreationAttrs {
    user_id: number;
    art_ids: number[];
    status?: OrderStatus;
}

@Table({
    tableName: "cart_history",
    indexes: [
        { fields: ["user_id"] },
        { fields: ["user_id", "status"] },
    ],
})
export class CartHistory extends Model<CartHistory, CartHistoryCreationAttrs> {
    @ApiProperty({ example: 1 })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: "ID пользователя-покупателя" })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User, { foreignKey: "user_id", as: "user" })
    user: User;

    @ApiProperty({
        example: [12, 15, 33],
        description: "Массив ID купленных картин",
        type: [Number],
    })
    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
    art_ids: number[];

    @ApiProperty({
        example: "in_transit",
        enum: ["delivered", "in_transit", "cancelled"],
        description: "Статус заказа",
    })
    @Column({
        type: DataType.ENUM("delivered", "in_transit", "cancelled"),
        allowNull: false,
        defaultValue: "in_transit",
    })
    status: OrderStatus;

    @ApiProperty({ example: "2026-07-31T00:00:00.000Z" })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;
}