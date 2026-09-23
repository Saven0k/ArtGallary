// src/cart/cart.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Cart } from "./cart.model";
import { CartResponse } from "./interfaces/cart.interface";

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart) private cartModel: typeof Cart,
    ) {}

    async getCart(userId: number): Promise<CartResponse> {
        const cart = await this.ensureCart(userId);
        return this.toResponse(cart);
    }

    async addItem(userId: number, artId: number): Promise<CartResponse> {
        const cart = await this.ensureCart(userId);

        // идемпотентно: повторное добавление не дублирует id
        if (!cart.art_ids.includes(artId)) {
            cart.art_ids = [...cart.art_ids, artId];
            await cart.save();
        }

        return this.toResponse(cart);
    }

    async removeItem(userId: number, artId: number): Promise<CartResponse> {
        const cart = await this.ensureCart(userId);

        if (!cart.art_ids.includes(artId)) {
            throw new NotFoundException("Картина не найдена в корзине");
        }

        cart.art_ids = cart.art_ids.filter((id) => id !== artId);
        await cart.save();

        return this.toResponse(cart);
    }

    async clear(userId: number): Promise<CartResponse> {
        const cart = await this.ensureCart(userId);
        cart.art_ids = [];
        await cart.save();
        return this.toResponse(cart);
    }

    // ---------- internals ----------

    private async ensureCart(userId: number): Promise<Cart> {
        const [cart] = await this.cartModel.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId, art_ids: [] },
        });
        return cart;
    }

    private toResponse(cart: Cart): CartResponse {
        return {
            userId: cart.user_id,
            artIds: cart.art_ids ?? [],
            itemsCount: (cart.art_ids ?? []).length,
        };
    }
}