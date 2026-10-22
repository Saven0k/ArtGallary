import { Op } from 'sequelize';
import { StatsService } from './stats.service';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { AuthorView } from '../authors/author-view.model';
import { AuthorProfile } from '../authors/author.model';
import { AuthorFollow } from '../authors/author-follow.model';
import { Country } from '../location/models/country.model';
import { User } from '../users/users.model';

describe('Statistics filters', () => {
  const service = new StatsService(
    {} as typeof AuthorView,
    {} as typeof ArtLike,
    {} as typeof ArtView,
    {} as typeof AuthorProfile,
    {} as typeof Art,
    {} as typeof AuthorFollow,
    {} as typeof Country,
  );

  afterEach(() => jest.useRealTimers());

  it('filters ages using the stored birthday column', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const filter = service['buildFilter']({ ageFrom: 18, ageTo: 25 });
    expect(filter).toEqual({
      user_birthday: {
        [Op.lte]: new Date('2008-10-08T23:59:59.999Z'),
        [Op.gt]: new Date('2000-10-08T23:59:59.999Z'),
      },
    });
  });

  it('preserves date, gender and location constraints', () => {
    expect(
      service['buildFilter']({
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        gender: 'F',
        cityId: 3,
        countryId: 4,
      }),
    ).toEqual({
      created_at: {
        [Op.gte]: new Date('2026-01-01'),
        [Op.lte]: new Date('2026-02-01T23:59:59.999Z'),
      },
      user_gender: 'F',
      city_id: 3,
      country_id: 4,
    });
  });

  it('includes the full final day but preserves an explicitly requested time', () => {
    expect(service['buildFilter']({ endDate: '2026-10-21' })).toEqual({
      created_at: { [Op.lte]: new Date('2026-10-21T23:59:59.999Z') },
    });
    expect(service['buildFilter']({ endDate: '2026-10-21T14:00:00Z' })).toEqual(
      {
        created_at: { [Op.lte]: new Date('2026-10-21T14:00:00Z') },
      },
    );
  });

  it('uses numeric ages for views instead of a missing birthday column', () => {
    expect(service['buildFilter']({ ageFrom: 18, ageTo: 24 }, true)).toEqual({
      user_age: { [Op.gte]: 18, [Op.lte]: 24 },
    });
  });

  it('uses the exact design age ranges, including unknown and underage viewers', () => {
    expect(
      service['countByAge']([
        ...[17, 18, 24, 25, 34, 35, 44, 45, 54, 55, 120, 121].map(
          (user_age) => ({ user_age }),
        ),
        {},
      ]),
    ).toEqual({
      '<18': 1,
      '18-24': 2,
      '25-34': 2,
      '35-44': 2,
      '45-54': 2,
      '55+': 2,
      unknown: 2,
    });
  });

  it('resolves birthdays at their calendar boundary', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-22T12:00:00Z'));
    expect(service['resolveAge']({ user_birthday: '2001-10-22' })).toBe(25);
    expect(service['resolveAge']({ user_birthday: '2001-10-23' })).toBe(24);
  });

  it('rejects inverted or oversized periods and inverted ages', () => {
    for (const filter of [
      { startDate: '2026-02-02', endDate: '2026-02-01' },
      { startDate: '2020-01-01', endDate: '2026-01-01' },
      { ageFrom: 35, ageTo: 18 },
    ])
      expect(() => service['withPeriod'](filter)).toThrow();
  });

  it('compares equal non-overlapping periods and fills empty days', () => {
    const filter = service['withPeriod']({
      startDate: '2026-10-20',
      endDate: '2026-10-22',
    });
    expect(service['previousPeriod'](filter)).toMatchObject({
      startDate: '2026-10-17T00:00:00.000Z',
      endDate: '2026-10-19T23:59:59.999Z',
    });
    expect(
      service['buildTimeline'](
        [{ created_at: '2026-10-21T12:00:00Z' }],
        filter,
      ),
    ).toEqual([
      { date: '2026-10-20', count: 0 },
      { date: '2026-10-21', count: 1 },
      { date: '2026-10-22', count: 0 },
    ]);
    expect(service['change'](4, 2)).toBe(100);
    expect(service['change'](0, 2)).toBe(-100);
    expect(service['change'](4, 0)).toBeNull();
    expect(service['change'](0, 0)).toBe(0);
    expect(
      service['buildTimeline']([], {
        startDate: '2026-10-20T12:00:00Z',
        endDate: '2026-10-22T06:00:00Z',
      }),
    ).toHaveLength(3);
  });
});

describe('Author statistics data', () => {
  const artRows = [
    { id: 10, title: 'Art A', image_path: '/static/a.jpg' },
    { id: 11, title: 'Art B', image_path: '/static/b.jpg' },
  ];
  const profile = { findByPk: jest.fn().mockResolvedValue({ user_id: 7 }) };
  const arts = {
    findAll: jest.fn().mockResolvedValue(artRows),
    findByPk: jest
      .fn()
      .mockResolvedValue({ id: 11, author_id: 7, title: 'Art B' }),
  };
  const likes = {
    findAll: jest
      .fn()
      .mockResolvedValue([
        { art_id: 10, user_id: 99, created_at: '2026-10-21T12:00:00Z' },
      ]),
    count: jest.fn().mockResolvedValue(0),
  };
  const views = {
    findAll: jest.fn().mockResolvedValue([
      {
        art_id: 11,
        user_id: 8,
        country_id: 1,
        user_age: 25,
        user_gender: 'F',
        created_at: '2026-10-22T12:00:00Z',
      },
      { art_id: 11, created_at: '2026-10-22T12:00:00Z' },
    ]),
    count: jest.fn().mockResolvedValue(1),
  };
  const authorViews = {
    findAll: jest
      .fn()
      .mockResolvedValue([
        { user_id: 8, user_age: 55, created_at: '2026-10-22T12:00:00Z' },
      ]),
    count: jest.fn().mockResolvedValue(1),
  };
  const follows = {
    count: jest.fn().mockResolvedValueOnce(3).mockResolvedValue(1),
  };
  const countries = {
    findAll: jest
      .fn()
      .mockResolvedValue([
        { id: 1, iso2: 'RU', name_en: 'Russia', name_ru: 'Россия' },
      ]),
  };
  const service = new StatsService(
    authorViews as unknown as typeof AuthorView,
    likes as unknown as typeof ArtLike,
    views as unknown as typeof ArtView,
    profile as unknown as typeof AuthorProfile,
    arts as unknown as typeof Art,
    follows as unknown as typeof AuthorFollow,
    countries as unknown as typeof Country,
  );

  it('scopes every query to the owner, ranks period activity and counts artwork demographics only', async () => {
    const result = await service.getAuthorStats(7, {
      startDate: '2026-10-21',
      endDate: '2026-10-22',
      lang: 'zh',
    });
    expect(arts.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { author_id: 7 } }),
    );
    const dates = {
      created_at: {
        [Op.gte]: new Date('2026-10-21T00:00:00Z'),
        [Op.lte]: new Date('2026-10-22T23:59:59.999Z'),
      },
    };
    for (const model of [likes, views])
      expect(model.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ...dates, art_id: { [Op.in]: [10, 11] } },
        }),
      );
    expect(authorViews.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...dates, author_id: 7 },
      }),
    );
    expect(follows.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...dates, author_id: 7 },
      }),
    );
    expect(result).toMatchObject({
      totalLikes: 1,
      totalViews: 3,
      artViews: 2,
      authorViews: 1,
      newFollowers: 3,
      uniqueUsers: 1,
      changes: { likes: null, views: 50, followers: 200 },
      viewsByGender: { female: 1, male: 0, unknown: 1 },
      viewsByAge: { '25-34': 1, '55+': 0, unknown: 1 },
      viewsByCountry: [{ countryName: '俄罗斯', count: 1 }],
      viewsTimeline: [
        { date: '2026-10-21', count: 0 },
        { date: '2026-10-22', count: 3 },
      ],
    });
    expect(
      result.popularArts.map((art) => [art.id, art.likes, art.views]),
    ).toEqual([
      [11, 0, 2],
      [10, 1, 0],
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /ip_address|user_id|user_gender/,
    );
  });

  it('handles an author without artworks without reading other authors activity', async () => {
    arts.findAll.mockResolvedValueOnce([]);
    const previousLikeCalls = likes.findAll.mock.calls.length;
    const previousViewCalls = views.findAll.mock.calls.length;
    const result = await service.getAuthorStats(7, {
      startDate: '2026-10-21',
      endDate: '2026-10-22',
    });
    expect(likes.findAll).toHaveBeenCalledTimes(previousLikeCalls);
    expect(views.findAll).toHaveBeenCalledTimes(previousViewCalls);
    expect(result).toMatchObject({
      totalLikes: 0,
      artViews: 0,
      popularArts: [],
      viewsByCountry: [],
    });
  });

  it('localizes real country names for all three languages without external translation', async () => {
    for (const [lang, name] of [
      ['ru', 'Россия'],
      ['en', 'Russia'],
      ['zh', '俄罗斯'],
    ])
      expect(
        await service['countByCountry']([{ country_id: 1 }], lang),
      ).toEqual([{ countryId: 1, countryName: name, count: 1 }]);
  });

  it('applies birthday filters to likes and numeric age filters to art views', async () => {
    await service.getArtStats(11, {
      startDate: '2026-10-21',
      endDate: '2026-10-22',
      ageFrom: 18,
      ageTo: 24,
      countryId: 1,
      lang: 'en',
    });
    expect(likes.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          ...service['buildFilter']({
            startDate: '2026-10-21',
            endDate: '2026-10-22',
            ageFrom: 18,
            ageTo: 24,
            countryId: 1,
          }),
          art_id: 11,
        },
      }),
    );
    expect(views.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          ...service['buildFilter'](
            {
              startDate: '2026-10-21',
              endDate: '2026-10-22',
              ageFrom: 18,
              ageTo: 24,
              countryId: 1,
            },
            true,
          ),
          art_id: 11,
        },
      }),
    );
  });

  it('filters followers through the user demographics rather than missing follow columns', async () => {
    const filter = service['withPeriod']({
      startDate: '2026-10-21',
      endDate: '2026-10-22',
      gender: 'F',
      ageFrom: 18,
      ageTo: 24,
      countryId: 1,
    });
    await service['countFollowers'](7, filter);
    expect(follows.count).toHaveBeenLastCalledWith({
      where: {
        author_id: 7,
        created_at: {
          [Op.gte]: new Date(filter.startDate),
          [Op.lte]: new Date(filter.endDate),
        },
      },
      include: [
        {
          model: User,
          attributes: [],
          where: {
            gender: 'F',
            country_id: 1,
            date_birthday: (
              service['buildFilter'](filter) as { user_birthday: unknown }
            ).user_birthday,
          },
        },
      ],
    });
  });

  it('rejects missing or deleted author profiles', async () => {
    profile.findByPk
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ user_id: 7, is_deleted: true });
    await expect(service.getAuthorStats(7)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.getAuthorStats(7)).rejects.toMatchObject({
      status: 404,
    });
  });
});
