import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateArtDto } from './dto/create-art.dto';
import { UpdateArtDTO } from './dto/update-art.dto';

describe.each([CreateArtDto, UpdateArtDTO])('%s artwork prices', (Dto) => {
  const base = {
    title: 'Art',
    description: '',
    date_published: '2026-10-20',
    author_id: 7,
  };

  it.each(['RUB', 'USD', 'CNY'])(
    'accepts %s and preserves a numeric multipart price',
    async (currency) => {
      const dto = plainToInstance(Dto, { ...base, cost: '1234.56', currency });
      expect(await validate(dto)).toEqual([]);
      expect(dto.cost).toBe(1234.56);
      expect(dto.currency).toBe(currency);
    },
  );

  it.each(['EUR', 'UAH', 'XXX', '¥', 'usd'])(
    'rejects unsupported currency %s',
    async (currency) => {
      expect(
        await validate(plainToInstance(Dto, { ...base, cost: 80, currency })),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'currency' }),
        ]),
      );
    },
  );

  it.each([-1, 'invalid', Infinity, 1.001])(
    'rejects invalid price %s',
    async (cost) => {
      expect(
        await validate(
          plainToInstance(Dto, { ...base, cost, currency: 'CNY' }),
        ),
      ).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'cost' })]),
      );
    },
  );

  it.each([0, null, ''])(
    'preserves zero or an unspecified price %s',
    async (cost) => {
      const dto = plainToInstance(Dto, {
        ...base,
        cost,
        currency: cost === 0 ? 'RUB' : null,
      });
      expect(await validate(dto)).toEqual([]);
      expect(dto.cost).toBe(cost === 0 ? 0 : null);
    },
  );
});
