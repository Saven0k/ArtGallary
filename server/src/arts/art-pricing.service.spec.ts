import { ArtPricingService } from './art-pricing.service';

const xml = (usd = '80,0000', cny = '100,0000', date = '20.10.2026') =>
  `<ValCurs Date="${date}"><Valute ID="USD"><CharCode>USD</CharCode><Nominal>1</Nominal><Value>${usd}</Value></Valute><Valute ID="CNY"><CharCode>CNY</CharCode><Nominal>10</Nominal><Value>${cny}</Value></Valute><Valute ID="EUR"><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>90,0000</Value></Valute></ValCurs>`;
const art = (cost: number | null = 80, currency: string | null = 'RUB') => ({
  id: 1,
  title: 'Art',
  image_path: '/art.png',
  cost,
  currency,
});

describe('artwork display prices', () => {
  const originalFetch = global.fetch;
  let service: ArtPricingService;
  let fetchRates: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    fetchRates = jest.fn(() => Promise.resolve(new Response(xml())));
    global.fetch = fetchRates;
    service = new ArtPricingService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    ['RUB', 'ru', 'RUB', 80],
    ['RUB', 'en', 'USD', 1],
    ['RUB', 'zh', 'CNY', 8],
    ['USD', 'ru', 'RUB', 6400],
    ['USD', 'en', 'USD', 80],
    ['USD', 'zh', 'CNY', 640],
    ['CNY', 'ru', 'RUB', 800],
    ['CNY', 'en', 'USD', 10],
    ['CNY', 'zh', 'CNY', 80],
  ] as const)(
    'converts %s for %s without changing the stored price',
    async (source, language, currency, amount) => {
      const input = art(80, source);
      const result = await service.localize(input, language);
      expect(result).toEqual({
        ...input,
        display_price: {
          amount,
          currency,
          rate: amount / 80,
          rate_date: source === currency ? null : '2026-10-20',
        },
      });
      expect(input).toEqual(art(80, source));
      expect(fetchRates).toHaveBeenCalledTimes(source === currency ? 0 : 1);
    },
  );

  it('uses the nominal, rounds to cents, and preserves zero, missing prices and legacy currencies', async () => {
    const result = await service.localize(
      [art(1), art(0), art(null), art(1, 'EUR'), art(1, null)],
      'en',
    );
    expect(result).toMatchObject([
      { display_price: { amount: 0.01 } },
      { display_price: { amount: 0 } },
      art(null),
      {
        currency: 'EUR',
        display_price: {
          amount: 1.13,
          currency: 'USD',
        },
      },
      { display_price: { amount: 0.01 } },
    ]);
  });

  it('localizes nested author works and Sequelize JSON without changing dates or order snapshots', async () => {
    const date = new Date();
    const result = await service.localize(
      {
        authors: [{ arts: [{ toJSON: () => art() }] }],
        date,
        pricing: { currency: 'RUB', price: 80 },
      },
      'zh',
    );
    expect(result).toEqual({
      authors: [
        {
          arts: [
            {
              ...art(),
              display_price: {
                amount: 8,
                currency: 'CNY',
                rate: 0.1,
                rate_date: '2026-10-20',
              },
            },
          ],
        },
      ],
      date,
      pricing: { currency: 'RUB', price: 80 },
    });
  });

  it('shares one cached request across concurrent responses and refreshes after an hour', async () => {
    await Promise.all(
      Array.from({ length: 10 }, () =>
        service.localize([art(), art(160)], 'en'),
      ),
    );
    expect(fetchRates).toHaveBeenCalledTimes(1);
    jest.setSystemTime(new Date('2026-10-20T13:00:01Z'));
    fetchRates.mockImplementation(() =>
      Promise.resolve(new Response(xml('100,0000'))),
    );
    expect(await service.localize(art(), 'en')).toMatchObject({
      display_price: { amount: 0.8 },
    });
    expect(fetchRates).toHaveBeenCalledTimes(2);
  });

  it('keeps recent rates on failure, backs off and stops using rates older than seven days', async () => {
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
    await service.localize(art(), 'en');
    jest.setSystemTime(new Date('2026-10-20T14:00:00Z'));
    fetchRates.mockRejectedValue(new Error('Offline'));
    expect(await service.localize(art(), 'en')).toMatchObject({
      display_price: { amount: 1 },
    });
    await service.localize(art(), 'zh');
    expect(fetchRates).toHaveBeenCalledTimes(2);
    jest.setSystemTime(new Date('2026-10-28T14:00:00Z'));
    expect(await service.localize(art(), 'en')).toEqual(art());
  });

  it.each([
    'invalid XML',
    xml('0'),
    xml('NaN'),
    xml('80', '0'),
    xml('80', '100', '01.01.2020'),
    xml('80', '100', '01.01.2030'),
  ])(
    'falls back to the actual currency when the provider returns invalid rates',
    async (body) => {
      jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
      fetchRates.mockImplementation(() => Promise.resolve(new Response(body)));
      expect(await service.localize(art(), 'en')).toEqual(art());
      expect(await service.localize(art(80, 'USD'), 'en')).toEqual({
        ...art(80, 'USD'),
        display_price: {
          amount: 80,
          currency: 'USD',
          rate: 1,
          rate_date: null,
        },
      });
    },
  );

  it('handles HTTP failures without breaking an artwork response', async () => {
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
    fetchRates.mockImplementation(() =>
      Promise.resolve(new Response('', { status: 503 })),
    );
    expect(await service.localize(art(), 'en')).toEqual(art());
  });
});
