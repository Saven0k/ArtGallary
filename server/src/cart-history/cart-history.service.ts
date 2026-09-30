
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


        cart.art_ids = [];
        await cart.save();

        return this.toItem(order);
    }





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