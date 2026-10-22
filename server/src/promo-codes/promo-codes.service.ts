import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction, UniqueConstraintError } from 'sequelize';
import { PromoCode } from './promo-code.model';
import { CreatePromoCodeDto, PromoCodeListDto } from './promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectModel(PromoCode) private readonly model: typeof PromoCode,
  ) {}

  async list({ page, limit }: PromoCodeListDto) {
    const { rows, count } = await this.model.findAndCountAll({
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
    return { items: rows, total: count, page, limit };
  }

  async create(dto: CreatePromoCodeDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (
      expiresAt &&
      (!Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now())
    )
      throw new BadRequestException({
        code: 'PROMO_EXPIRY_INVALID',
        message: 'PROMO_EXPIRY_INVALID',
      });
    try {
      return await this.model.create({
        code: dto.code.trim().toUpperCase(),
        percent: dto.percent,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new ConflictException({
          code: 'PROMO_CODE_EXISTS',
          message: 'PROMO_CODE_EXISTS',
        });
      throw error;
    }
  }

  async setActive(id: number, active: boolean) {
    const [count, rows] = await this.model.update(
      { active },
      { where: { id }, returning: true },
    );
    if (!count)
      throw new NotFoundException({
        code: 'PROMO_CODE_NOT_FOUND',
        message: 'PROMO_CODE_NOT_FOUND',
      });
    return rows[0];
  }

  async getValid(code: string, transaction?: Transaction): Promise<PromoCode> {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalized))
      throw new BadRequestException({
        code: 'PROMO_CODE_INVALID',
        message: 'PROMO_CODE_INVALID',
      });
    const promo = await this.model.findOne({
      where: { code: normalized },
      ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    });
    if (
      !promo?.active ||
      (promo.expiresAt && promo.expiresAt.getTime() <= Date.now())
    )
      throw new BadRequestException({
        code: 'PROMO_CODE_INVALID',
        message: 'PROMO_CODE_INVALID',
      });
    return promo;
  }
}
