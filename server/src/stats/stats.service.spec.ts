import { Op } from 'sequelize';
import { StatsService } from './stats.service';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { AuthorView } from '../authors/author-view.model';
import { AuthorProfile } from '../authors/author.model';

describe('Statistics filters', () => {
  const service = new StatsService(
    {} as typeof AuthorView,
    {} as typeof ArtLike,
    {} as typeof ArtView,
    {} as typeof AuthorProfile,
    {} as typeof Art,
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
        [Op.lte]: new Date('2026-02-01'),
      },
      user_gender: 'F',
      city_id: 3,
      country_id: 4,
    });
  });
});
