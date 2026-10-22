import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../cart/cart.model';
import { CartHistory, OrderStatus } from './cart-history.model';
import {
  OrderHistoryItem,
  OrderHistoryResponse,
} from './interfaces/cart-history.interface';
import { Art, ART_STATUS } from '../arts/arts.model';
import {
  assertPurchasable,
  PURCHASABLE_AUTHOR_INCLUDE,
} from '../cart/cart-validation';
import { CheckoutDto } from './dto/cart-history.dto';
import { Op } from 'sequelize';
import { AuthorProfile } from '../authors/author.model';
import { User } from '../users/users.model';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

@Injectable()
export class CartHistoryService {
  constructor(
    @InjectModel(CartHistory) private historyModel: typeof CartHistory,
    @InjectModel(Cart) private cartModel: typeof Cart,
    @InjectModel(Art) private artModel: typeof Art,
    private readonly promoCodes: PromoCodesService,
  ) {}

  async getHistory(
    userId: number,
    status?: OrderStatus,
  ): Promise<OrderHistoryResponse> {
    const where: { user_id: number; status?: OrderStatus } = {
      user_id: userId,
    };
    if (status) where.status = status;

    const rows = await this.historyModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    const orders = rows.map((row) => this.toItem(row));
    const missingIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.artIds.filter((id) => {
            const item = order.items?.find((line) => line.artId === id);
            return (
              !item ||
              item.authorName === undefined ||
              item.specifications === undefined
            );
          }),
        ),
      ),
    ];
    const arts = missingIds.length
      ? await this.artModel.findAll({
          where: { id: { [Op.in]: missingIds } },
          attributes: [
            'id',
            'title',
            'image_path',
            'specifications',
            'currency',
          ],
          include: [
            {
              model: AuthorProfile,
              attributes: ['user_id'],
              include: [{ model: User, attributes: ['name', 'surname'] }],
            },
          ],
        })
      : [];
    const byId = new Map(arts.map((art) => [art.id, art]));
    return {
      items: orders.map((order) => ({
        ...order,
        items: order.artIds.map((id) => {
          const saved = order.items?.find((item) => item.artId === id);
          const art = byId.get(id);
          return {
            artId: id,
            title: saved?.title ?? art?.title ?? '',
            imagePath: saved?.imagePath ?? art?.image_path ?? '',
            authorName:
              saved?.authorName ??
              [art?.author?.user?.surname, art?.author?.user?.name]
                .filter(Boolean)
                .join(' '),
            specifications: saved?.specifications ?? art?.specifications ?? '',
            price: saved?.price ?? null,
            total: saved?.total ?? null,
            quantity: saved?.quantity ?? 1,
            currency: saved?.currency ?? art?.currency ?? 'RUB',
          };
        }),
      })),
      total: rows.length,
    };
  }

  async checkout(
    userId: number,
    dto: CheckoutDto = {},
  ): Promise<OrderHistoryItem> {
    return this.cartModel.sequelize.transaction(async (transaction) => {
      const cart = await this.cartModel.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!cart?.art_ids?.length)
        throw new BadRequestException('Корзина пуста');
      const requested =
        dto.items ?? cart.art_ids.map((artId) => ({ artId, quantity: 1 }));
      const ids = new Set(requested.map((item) => item.artId));
      if (
        requested.length !== cart.art_ids.length ||
        ids.size !== requested.length ||
        cart.art_ids.some((id) => !ids.has(id))
      ) {
        throw new BadRequestException(
          'Состав корзины изменился. Обновите страницу.',
        );
      }
      const arts = await this.artModel.findAll({
        where: { id: { [Op.in]: [...ids] } },
        include: [PURCHASABLE_AUTHOR_INCLUDE],
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const items = requested.map((item) => {
        const art = arts.find((candidate) => candidate.id === item.artId);
        assertPurchasable(art);
        if (
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 999 ||
          (Number(art.cost) > 5000 && item.quantity !== 1)
        ) {
          throw new BadRequestException('Некорректное количество картин');
        }
        const price = Math.round(Number(art.cost) * 100) / 100;
        return {
          artId: art.id,
          title: art.title,
          imagePath: art.image_path,
          authorName: [art.author?.user?.surname, art.author?.user?.name]
            .filter(Boolean)
            .join(' '),
          specifications: art.specifications ?? '',
          price,
          quantity: item.quantity,
          currency: art.currency ?? 'RUB',
          total: Math.round(price * item.quantity * 100) / 100,
        };
      });
      if (new Set(items.map((item) => item.currency)).size !== 1)
        throw new BadRequestException('В одном заказе должна быть одна валюта');
      const promo = dto.promoCode
        ? await this.promoCodes.getValid(dto.promoCode, transaction)
        : null;
      const subtotal =
        Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) /
        100;
      if (!Number.isSafeInteger(Math.round(subtotal * 100)))
        throw new BadRequestException('Сумма заказа слишком велика');
      const discount = Math.round(subtotal * (promo?.percent ?? 0)) / 100;
      const order = await this.historyModel.create(
        {
          user_id: userId,
          art_ids: [...cart.art_ids],
          status: 'in_transit',
          pricing: {
            items,
            subtotal,
            discount,
            total: Math.round((subtotal - discount) * 100) / 100,
            currency: items[0].currency,
            promoCode: promo?.code ?? null,
          },
        },
        { transaction },
      );
      for (const art of arts)
        if (Number(art.cost) > 5000)
          await art.update({ status: ART_STATUS.SOLD }, { transaction });
      cart.art_ids = [];
      await cart.save({ transaction });
      return this.toItem(order);
    });
  }

  async updateStatus(
    historyId: number,
    status: OrderStatus,
  ): Promise<OrderHistoryItem> {
    const order = await this.historyModel.findByPk(historyId);
    if (!order) throw new NotFoundException('Заказ не найден');

    order.status = status;
    await order.save();

    return this.toItem(order);
  }

  private toItem(row: CartHistory): OrderHistoryItem {
    return {
      ...row.pricing,
      id: row.id,
      userId: row.user_id,
      artIds: row.art_ids ?? [],
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
  }
}
