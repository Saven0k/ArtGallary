import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { ArtLike } from '../arts/art-like.model';
import { ArtView } from '../arts/art-view.model';
import { Art } from '../arts/arts.model';
import { AuthorView } from 'src/authors/author-view.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorFollow } from '../authors/author-follow.model';
import { Country } from '../location/models/country.model';
import { User } from '../users/users.model';
import { StatsFilterDto } from './dto/stats.dto';
import {
  AuthorStatsResponse,
  ArtStatsResponse,
  GenderStats,
  AgeStats,
  CountryStats,
  TimelineData,
} from './interfaces/stats.interface';

interface StatsRow {
  art_id?: number;
  user_id?: number;
  user_gender?: string;
  user_age?: number;
  user_birthday?: Date | string;
  country_id?: number;
  created_at?: Date | string;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(AuthorView) private authorViewModel: typeof AuthorView,
    @InjectModel(ArtLike) private artLikeModel: typeof ArtLike,
    @InjectModel(ArtView) private artViewModel: typeof ArtView,
    @InjectModel(AuthorProfile)
    private authorProfileModel: typeof AuthorProfile,
    @InjectModel(Art) private artModel: typeof Art,
    @InjectModel(AuthorFollow) private followModel: typeof AuthorFollow,
    @InjectModel(Country) private countryModel: typeof Country,
  ) {}

  async getAuthorStats(
    authorId: number,
    filter: StatsFilterDto = {},
  ): Promise<AuthorStatsResponse> {
    filter = this.withPeriod(filter);
    const author = await this.authorProfileModel.findByPk(authorId);
    if (!author || author.is_deleted) {
      throw new HttpException('Автор не найден', HttpStatus.NOT_FOUND);
    }

    const arts = await this.artModel.findAll({
      where: { author_id: authorId },
      attributes: ['id', 'title', 'image_path'],
      raw: true,
    });
    const artIds = arts.map((a) => a.id);

    const where = this.buildFilter(filter);
    const viewWhere = this.buildFilter(filter, true);
    const artWhere = artIds.length
      ? { ...where, art_id: { [Op.in]: artIds } }
      : null;

    const previous = this.previousPeriod(filter);
    const previousLikes = this.buildFilter(previous);
    const previousViews = this.buildFilter(previous, true);
    const [
      artLikes,
      artViews,
      authorViews,
      newFollowers,
      oldLikes,
      oldArtViews,
      oldAuthorViews,
      oldFollowers,
    ] = await Promise.all([
      artWhere
        ? this.artLikeModel.findAll({
            where: artWhere,
            attributes: [
              'art_id',
              'user_id',
              'user_gender',
              'user_birthday',
              'country_id',
              'created_at',
            ],
            raw: true,
          })
        : Promise.resolve([] as ArtLike[]),
      artWhere
        ? this.artViewModel.findAll({
            where: { ...viewWhere, art_id: { [Op.in]: artIds } },
            attributes: [
              'art_id',
              'user_id',
              'user_gender',
              'user_age',
              'country_id',
              'created_at',
            ],
            raw: true,
          })
        : Promise.resolve([] as ArtView[]),
      this.authorViewModel.findAll({
        where: { ...viewWhere, author_id: authorId },
        attributes: ['user_id', 'created_at'],
        raw: true,
      }),
      this.countFollowers(authorId, filter),
      artIds.length
        ? this.artLikeModel.count({
            where: { ...previousLikes, art_id: { [Op.in]: artIds } },
          })
        : 0,
      artIds.length
        ? this.artViewModel.count({
            where: { ...previousViews, art_id: { [Op.in]: artIds } },
          })
        : 0,
      this.authorViewModel.count({
        where: { ...previousViews, author_id: authorId },
      }),
      this.countFollowers(authorId, previous),
    ]);

    const allViews = [...artViews, ...authorViews];
    const [likesByCountry, viewsByCountry] = await Promise.all([
      this.countByCountry(artLikes, filter.lang),
      this.countByCountry(artViews, filter.lang),
    ]);
    const likesPerArt = this.countPerArt(artLikes);
    const viewsPerArt = this.countPerArt(artViews);

    return {
      authorId,
      newFollowers,
      changes: {
        likes: this.change(artLikes.length, oldLikes),
        views: this.change(allViews.length, oldArtViews + oldAuthorViews),
        followers: this.change(newFollowers, oldFollowers),
      },
      popularArts: arts
        .map((art) => ({
          id: art.id,
          title: art.title,
          image_path: art.image_path,
          likes: likesPerArt.get(art.id) ?? 0,
          views: viewsPerArt.get(art.id) ?? 0,
        }))
        .filter((art) => art.views > 0 || art.likes > 0)
        .sort((a, b) => b.views - a.views || b.likes - a.likes || a.id - b.id)
        .slice(0, 3),

      totalLikes: artLikes.length,
      totalViews: allViews.length,

      likesByGender: this.countByGender(artLikes),
      likesByAge: this.countByAge(artLikes),
      likesByCountry,
      likesTimeline: this.buildTimeline(artLikes, filter),

      viewsByGender: this.countByGender(artViews),
      viewsByAge: this.countByAge(artViews),
      viewsByCountry,
      viewsTimeline: this.buildTimeline(allViews, filter),

      artViews: artViews.length,
      authorViews: authorViews.length,
      uniqueUsers: this.countUniqueUsers(allViews),
    };
  }

  async getArtStats(
    artId: number,
    filter: StatsFilterDto = {},
  ): Promise<ArtStatsResponse> {
    filter = this.withPeriod(filter);
    const art = await this.artModel.findByPk(artId, {
      attributes: ['id', 'author_id', 'title'],
    });
    if (!art) {
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
    }

    const where = this.buildFilter(filter);

    const [likes, views] = await Promise.all([
      this.artLikeModel.findAll({
        where: { ...where, art_id: artId },
        raw: true,
      }),
      this.artViewModel.findAll({
        where: { ...this.buildFilter(filter, true), art_id: artId },
        raw: true,
      }),
    ]);
    const [likesByCountry, viewsByCountry] = await Promise.all([
      this.countByCountry(likes, filter.lang),
      this.countByCountry(views, filter.lang),
    ]);

    return {
      artId,
      authorId: art.author_id,
      title: art.title,

      totalLikes: likes.length,
      totalViews: views.length,

      likesByGender: this.countByGender(likes),
      likesByAge: this.countByAge(likes),
      likesByCountry,
      likesTimeline: this.buildTimeline(likes, filter),

      viewsByGender: this.countByGender(views),
      viewsByAge: this.countByAge(views),
      viewsByCountry,
      viewsTimeline: this.buildTimeline(views, filter),

      uniqueUsers: this.countUniqueUsers(views),
    };
  }

  async getArt(artId: number): Promise<Art | null> {
    return this.artModel.findByPk(artId, {
      attributes: ['id', 'author_id', 'title'],
    });
  }

  private withPeriod(filter: StatsFilterDto): StatsFilterDto {
    const end = new Date(filter.endDate ?? Date.now());
    if (filter.endDate && /^\d{4}-\d{2}-\d{2}$/.test(filter.endDate))
      end.setUTCHours(23, 59, 59, 999);
    const start = filter.startDate ? new Date(filter.startDate) : new Date(end);
    if (!filter.startDate) {
      start.setUTCDate(start.getUTCDate() - 29);
      start.setUTCHours(0, 0, 0, 0);
    }
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start > end ||
      end.getTime() - start.getTime() > 366 * 86400000
    ) {
      throw new BadRequestException(
        'Период должен составлять от 1 до 366 дней',
      );
    }
    if (
      filter.ageFrom !== undefined &&
      filter.ageTo !== undefined &&
      filter.ageFrom > filter.ageTo
    )
      throw new BadRequestException('Некорректный возрастной диапазон');
    return {
      ...filter,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  private previousPeriod(filter: StatsFilterDto): StatsFilterDto {
    const start = new Date(filter.startDate).getTime();
    const end = new Date(filter.endDate).getTime();
    return {
      ...filter,
      startDate: new Date(start - (end - start + 1)).toISOString(),
      endDate: new Date(start - 1).toISOString(),
    };
  }

  private countFollowers(
    authorId: number,
    filter: StatsFilterDto,
  ): Promise<number> {
    const { created_at, user_gender, user_birthday, ...location } =
      this.buildFilter(filter) as Record<string, unknown>;
    const userWhere = {
      ...location,
      ...(user_gender ? { gender: user_gender } : {}),
      ...(user_birthday ? { date_birthday: user_birthday } : {}),
    };
    return this.followModel.count({
      where: { author_id: authorId, created_at },
      ...(Object.keys(userWhere).length
        ? { include: [{ model: User, attributes: [], where: userWhere }] }
        : {}),
    });
  }

  private change(current: number, previous: number): number | null {
    return previous
      ? Math.round(((current - previous) / previous) * 100)
      : current
        ? null
        : 0;
  }

  private countPerArt(rows: StatsRow[]): Map<number, number> {
    const counts = new Map<number, number>();
    for (const row of rows)
      if (row.art_id != null)
        counts.set(row.art_id, (counts.get(row.art_id) ?? 0) + 1);
    return counts;
  }

  private buildFilter(filter: StatsFilterDto, views = false): WhereOptions {
    const where: {
      created_at?: { [Op.gte]?: Date; [Op.lte]?: Date };
      user_gender?: string;
      user_birthday?: { [Op.lte]?: Date; [Op.gt]?: Date };
      user_age?: { [Op.gte]?: number; [Op.lte]?: number };
      city_id?: number;
      country_id?: number;
    } = {};

    if (filter.startDate || filter.endDate) {
      where.created_at = {};
      if (filter.startDate)
        where.created_at[Op.gte] = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate))
          end.setUTCHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }
    if (filter.gender) where.user_gender = filter.gender;
    if (views && (filter.ageFrom !== undefined || filter.ageTo !== undefined)) {
      where.user_age = {};
      if (filter.ageFrom !== undefined) where.user_age[Op.gte] = filter.ageFrom;
      if (filter.ageTo !== undefined) where.user_age[Op.lte] = filter.ageTo;
    } else if (filter.ageFrom !== undefined || filter.ageTo !== undefined) {
      where.user_birthday = {};
      const today = new Date();
      today.setUTCHours(23, 59, 59, 999);
      if (filter.ageFrom !== undefined) {
        const latestBirthday = new Date(today);
        latestBirthday.setUTCFullYear(today.getUTCFullYear() - filter.ageFrom);
        where.user_birthday[Op.lte] = latestBirthday;
      }
      if (filter.ageTo !== undefined) {
        const earliestBirthday = new Date(today);
        earliestBirthday.setUTCFullYear(
          today.getUTCFullYear() - filter.ageTo - 1,
        );
        where.user_birthday[Op.gt] = earliestBirthday;
      }
    }
    if (filter.cityId) where.city_id = filter.cityId;
    if (filter.countryId) where.country_id = filter.countryId;

    return where;
  }

  private countUniqueUsers(data: StatsRow[]): number {
    const set = new Set<number>();
    for (const item of data) {
      if (item.user_id != null) set.add(item.user_id);
    }
    return set.size;
  }

  private countByGender(data: StatsRow[]): GenderStats {
    return data.reduce(
      (acc, item) => {
        if (item.user_gender === 'M') acc.male++;
        else if (item.user_gender === 'F') acc.female++;
        else acc.unknown++;
        return acc;
      },
      { male: 0, female: 0, unknown: 0 } as GenderStats,
    );
  }

  private countByAge(data: StatsRow[]): AgeStats {
    const result: AgeStats = {
      '<18': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55+': 0,
      unknown: 0,
    };

    for (const item of data) {
      const age = this.resolveAge(item);
      if (age == null || age < 0 || age > 120) result.unknown++;
      else if (age < 18) result['<18']++;
      else if (age < 25) result['18-24']++;
      else if (age < 35) result['25-34']++;
      else if (age < 45) result['35-44']++;
      else if (age < 55) result['45-54']++;
      else result['55+']++;
    }

    return result;
  }

  private resolveAge(item: StatsRow): number | null {
    if (typeof item.user_age === 'number') return item.user_age;
    if (item.user_birthday) {
      const bd = new Date(item.user_birthday);
      if (!Number.isFinite(bd.getTime())) return null;
      const today = new Date();
      const birthdayPending =
        today.getUTCMonth() < bd.getUTCMonth() ||
        (today.getUTCMonth() === bd.getUTCMonth() &&
          today.getUTCDate() < bd.getUTCDate());
      return (
        today.getUTCFullYear() - bd.getUTCFullYear() - Number(birthdayPending)
      );
    }
    return null;
  }

  private async countByCountry(
    data: StatsRow[],
    lang = 'ru',
  ): Promise<CountryStats[]> {
    const map = new Map<number, number>();
    for (const item of data) {
      if (!item.country_id) continue;
      map.set(item.country_id, (map.get(item.country_id) || 0) + 1);
    }

    if (!map.size) return [];
    const countries = await this.countryModel.findAll({
      where: { id: { [Op.in]: [...map.keys()] } },
      attributes: ['id', 'iso2', 'name_ru', 'name_en'],
      raw: true,
    });
    const names = new Intl.DisplayNames([lang], { type: 'region' });
    const byId = new Map(countries.map((country) => [country.id, country]));
    return Array.from(map.entries())
      .map(([countryId, count]) => ({
        countryId,
        countryName: byId.get(countryId)?.iso2?.match(/^[A-Za-z]{2}$/)
          ? names.of(byId.get(countryId).iso2.toUpperCase())
          : (lang === 'ru'
              ? byId.get(countryId)?.name_ru
              : byId.get(countryId)?.name_en) ||
            byId.get(countryId)?.name_en ||
            '',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private buildTimeline(
    data: StatsRow[],
    filter: StatsFilterDto,
  ): TimelineData[] {
    const map = new Map<string, number>();
    const end = new Date(filter.endDate);
    const firstDay = new Date(filter.startDate);
    firstDay.setUTCHours(0, 0, 0, 0);
    for (const day = firstDay; day <= end; day.setUTCDate(day.getUTCDate() + 1))
      map.set(day.toISOString().slice(0, 10), 0);
    for (const item of data) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at).toISOString().split('T')[0];
      map.set(date, (map.get(date) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
