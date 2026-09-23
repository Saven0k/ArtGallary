// src/cart-history/cart-history.service.ts
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Cart } from "../cart/cart.model";
import { CartHistory, OrderStatus } from "./cart-history.model";
import {
    OrderHistoryItem,
    OrderHistoryResponse,
} from "./interfaces/cart-history.interface";

@Injectable()
export class CartHistoryService {
    constructor(
        @InjectModel(CartHistory) private historyModel: typeof CartHistory,
        @InjectModel(Cart) private cartModel: typeof Cart,
    ) {}

    /**
     * Возвращает историю заказов пользователя.
     * Если передан status — фильтрует по нему.
     */
    async getHistory(
        userId: number,
        status?: OrderStatus,
    ): Promise<OrderHistoryResponse> {
        const where: any = { user_id: userId };
        if (status) where.status = status;

        const rows = await this.historyModel.findAll({
            where,
            order: [["created_at", "DESC"]],
        });

        return {
            items: rows.map((r) => this.toItem(r)),
            total: rows.length,
        };
    }

    /**
     * «Оформить заказ»: переносит текущую корзину в историю
     * и очищает её. Статус нового заказа — in_transit.
     */
    async checkout(userId: number): Promise<OrderHistoryItem> {
        const cart = await this.cartModel.findByPk(userId);
        if (!cart || !cart.art_ids || cart.art_ids.length === 0) {
            throw new BadRequestException("Корзина пуста");
        }

        const order = await this.historyModel.create({
            user_id: userId,
            art_ids: cart.art_ids,
            status: "in_transit",
        });

        // Очищаем корзину после успешного оформления
        cart.art_ids = [];
        await cart.save();

        return this.toItem(order);
    }

    /**
     * Обновление статуса — только для админа/модератора
     * (проверка роли — на уровне контроллера).
     */
    async updateStatus(
        historyId: number,
        status: OrderStatus,
    ): Promise<OrderHistoryItem> {
        const order = await this.historyModel.findByPk(historyId);
        if (!order) throw new NotFoundException("Заказ не найден");

        order.status = status;
        await order.save();

        return this.toItem(order);
    }

    // ---------- internals ----------

    private toItem(row: CartHistory): OrderHistoryItem {
        return {
            id: row.id,
            userId: row.user_id,
            artIds: row.art_ids ?? [],
            status: row.status,
            createdAt: row.created_at.toISOString(),
        };
    }
}