import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from './cart.model';
import { CartResponse } from './interfaces/cart.interface';
import { Art } from '../arts/arts.model';
import {
  assertPurchasable,
  PURCHASABLE_AUTHOR_INCLUDE,
} from './cart-validation';
import { Transaction } from 'sequelize';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart) private cartModel: typeof Cart,
    @InjectModel(Art) private artModel: typeof Art,
  ) {}

  async getCart(userId: number): Promise<CartResponse> {
    const cart = await this.ensureCart(userId);
    return this.toResponse(cart);
  }

  async addItem(userId: number, artId: number): Promise<CartResponse> {
    if (!Number.isInteger(artId) || artId < 1)
      throw new BadRequestException('Некорректный ID картины');
    await this.ensureCart(userId);
    return this.cartModel.sequelize.transaction(async (transaction) => {
      const cart = await this.lockCart(userId, transaction);
      assertPurchasable(
        await this.artModel.findByPk(artId, {
          transaction,
          include: [PURCHASABLE_AUTHOR_INCLUDE],
        }),
      );
      if (!cart.art_ids.includes(artId)) {
        cart.art_ids = [...cart.art_ids, artId];
        await cart.save({ transaction });
      }
      return this.toResponse(cart);
    });
  }

  async removeItem(userId: number, artId: number): Promise<CartResponse> {
    await this.ensureCart(userId);
    return this.cartModel.sequelize.transaction(async (transaction) => {
      const cart = await this.lockCart(userId, transaction);
      if (!cart.art_ids.includes(artId))
        throw new NotFoundException('Картина не найдена в корзине');
      cart.art_ids = cart.art_ids.filter((id) => id !== artId);
      await cart.save({ transaction });
      return this.toResponse(cart);
    });
  }

  async clear(userId: number): Promise<CartResponse> {
    await this.ensureCart(userId);
    return this.cartModel.sequelize.transaction(async (transaction) => {
      const cart = await this.lockCart(userId, transaction);
      cart.art_ids = [];
      await cart.save({ transaction });
      return this.toResponse(cart);
    });
  }

  private async ensureCart(userId: number): Promise<Cart> {
    const [cart] = await this.cartModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, art_ids: [] },
    });
    return cart;
  }

  private async lockCart(
    userId: number,
    transaction: Transaction,
  ): Promise<Cart> {
    return this.cartModel.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private toResponse(cart: Cart): CartResponse {
    return {
      userId: cart.user_id,
      artIds: cart.art_ids ?? [],
      itemsCount: (cart.art_ids ?? []).length,
    };
  }
}
