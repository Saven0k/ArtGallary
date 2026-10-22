import { BadRequestException } from '@nestjs/common';
import { Art, ART_STATUS, ART_CURRENCIES } from '../arts/arts.model';
import { AuthorProfile } from '../authors/author.model';
import { User } from '../users/users.model';

export const PURCHASABLE_AUTHOR_INCLUDE = {
  model: AuthorProfile,
  required: true,
  attributes: ['user_id', 'is_deleted'],
  include: [
    {
      model: User,
      required: true,
      attributes: ['id', 'name', 'surname', 'is_deleted'],
    },
  ],
};

export function assertPurchasable(art: Art | null): asserts art is Art {
  if (
    !art ||
    art.status !== ART_STATUS.ON_SALE ||
    !art.author ||
    art.author.is_deleted ||
    !art.author.user ||
    art.author.user.is_deleted
  )
    throw new BadRequestException('Картина больше не доступна для покупки');
  let moderation: unknown;
  try {
    moderation = JSON.parse(art.moderate) as unknown;
  } catch {
    throw new BadRequestException('Картина не прошла модерацию');
  }
  if (
    !moderation ||
    typeof moderation !== 'object' ||
    !('moderate' in moderation) ||
    moderation.moderate !== true
  ) {
    throw new BadRequestException('Картина не прошла модерацию');
  }
  const cents = Math.round(Number(art.cost) * 100);
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    !ART_CURRENCIES.some((currency) => currency === (art.currency ?? 'RUB'))
  ) {
    throw new BadRequestException('Для картины не задана корректная цена');
  }
}
