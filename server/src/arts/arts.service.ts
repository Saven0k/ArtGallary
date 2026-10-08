import { type Request } from 'express';
import { type WhereOptions, type Transaction } from 'sequelize';
import { type ModerateObject } from '../types/moderate.types';
import { type UploadedImage } from '../files/files.service';
// arts.service.ts
import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

import { Art, ART_STATUS, type ArtStatus } from './arts.model';
import { ArtLike } from './art-like.model';
import { ArtView } from './art-view.model';
import { CreateArtDto } from './dto/create-art.dto';
import { UpdateArtDTO } from './dto/update-art.dto';
import { ModerateArtDto } from './dto/moderate-art.dto';
import { FilesService } from '../files/files.service';
import { User } from '../users/users.model';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { Tag } from 'src/tags/tag.model';
import { TagsService } from 'src/tags/tags.service';
import { Country } from '../location/models/country.model';
import { City } from '../location/models/city.model';
import { Subscription } from 'src/subscriptions/subscription.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorFollow } from 'src/authors/author-follow.model';
import { NotificationType } from 'src/notifications/notification.model';
import { NotificationService } from 'src/notifications/notification.service';
import { LocationService } from '../location/location.service';
import { Role } from '../auth/enums/role.enum';

type Lang = 'ru' | 'en';
type FilterType = 'all' | 'moderated' | 'unmoderated';

@Injectable()
export class ArtsService {
  private readonly PLAN_WEIGHT = { free: 0, pro: 50, vip: 100 };
  private readonly FRESHNESS_DAYS = 30;
  private readonly FEATURED_BONUS = 200;
  private readonly FEATURED_DAYS = 7;
  private readonly VIEW_WINDOW_MS = 30 * 60 * 1000;

  constructor(
    @InjectModel(Art) private artRepository: typeof Art,
    @InjectModel(AuthorFollow) private followModel: typeof AuthorFollow,
    @InjectModel(ArtLike) private artLikeModel: typeof ArtLike,
    @InjectModel(ArtView) private artViewModel: typeof ArtView,
    @InjectModel(AuthorProfile)
    private authorProfileModel: typeof AuthorProfile,
    @InjectModel(User) private userRepository: typeof User,
    @InjectConnection() private sequelize: Sequelize,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private fileService: FilesService,
    private locationService: LocationService,
    private tagsService: TagsService,
    private notificationService: NotificationService,
  ) {}

  async createArt(
    dto: CreateArtDto,
    imagePath: UploadedImage,
    artistId: number,
  ) {
    if (
      dto.country_id &&
      !(await this.locationService.getCountryById(dto.country_id))
    ) {
      throw new HttpException('Страна не найдена', HttpStatus.BAD_REQUEST);
    }
    if (dto.city_id && !(await this.locationService.getCityById(dto.city_id))) {
      throw new HttpException('Город не найден', HttpStatus.BAD_REQUEST);
    }

    const author = await this.authorProfileModel.findByPk(artistId, {
      include: [{ model: User, attributes: ['id', 'is_deleted'] }],
    });
    if (!author || author.is_deleted || author.user?.is_deleted)
      throw new HttpException('Автор не найден', HttpStatus.BAD_REQUEST);
    const transaction = await this.sequelize.transaction();
    let art: Art;
    let fileName: string;
    try {
      fileName = await this.fileService.createFile(imagePath);
      art = await this.artRepository.create(
        {
          ...this.buildArtData(dto, artistId),
          image_path: fileName,
          score: 0,
          status: ART_STATUS.ON_SALE,
          moderate: JSON.stringify({
            moderate: false,
            moderator_id: null,
            errors: {},
            moderated_at: null,
            comment: null,
          }),
        },
        { transaction },
      );
      if (dto.tags?.length) {
        const tags = await this.tagsService.findOrCreateTags(dto.tags);
        await art.$set('tags', tags, { transaction });
      }
      await art.update(
        { score: await this.calculateScore(art) },
        { transaction },
      );
      await transaction.commit();
    } catch (e: unknown) {
      await transaction.rollback();
      if (fileName) await this.fileService.removeFile(fileName);
      this.handleError(
        'createArt',
        e,
        `Error creating art: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
    }
    return this.findArtWithLocation(art.id);
  }

  async updateArtStatus(id: number, status: ArtStatus) {
    const art = await this.artRepository.findByPk(id);
    if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

    if (art.status === status) return this.findArtWithLocation(id);

    await art.update({ status });
    return this.findArtWithLocation(id);
  }

  async getArtById(id: number, lang: string = 'ru') {
    const art = await this.artRepository.findByPk(id, {
      include: this.getDefaultIncludesWithLocation(lang),
    });
    return art ? this.formatArtWithLocation(art.toJSON<Art>(), lang) : null;
  }

  async getAccessibleArtById(
    id: number,
    user?: { id: number; role: Role } | null,
  ) {
    const art = await this.getArtById(id);
    if (!art)
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
    if (
      user &&
      (user.role === Role.Admin ||
        user.role === Role.Moderator ||
        art.author_id === user.id)
    )
      return art;
    if (
      art.moderate?.moderate !== true ||
      art.status === ART_STATUS.ARCHIVED ||
      !art.author ||
      art.author.is_deleted ||
      art.author.user?.is_deleted
    ) {
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
    }
    return art;
  }

  getAllArts(page = 1, limit = 12, lang: Lang = 'ru') {
    return this.getArtsWithFilters(page, limit, lang, 'all');
  }

  getUnmoderatedArts(page = 1, limit = 12, lang: Lang = 'ru') {
    return this.getArtsWithFilters(page, limit, lang, 'unmoderated');
  }

  async getModeratedArts(page = 1, limit = 12, lang: string = 'ru') {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.artRepository.findAndCountAll({
      where: this.publicArtWhere(),
      include: this.getDefaultIncludesWithLocation(lang, true),
      order: [
        ['score', 'DESC'],
        ['likes', 'DESC'],
        ['views', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const arts = rows
      .filter((art) => this.parseModerate(art.moderate)?.moderate === true)
      .map((art) => this.formatArtWithLocation(art.toJSON<Art>(), lang));

    return { arts, pagination: this.buildPagination(count, page, limit) };
  }

  async getTopArts(limit = 10, lang = 'ru') {
    const arts = await this.artRepository.findAll({
      where: {
        ...this.publicArtWhere(),
      },
      include: this.getDefaultIncludesWithLocation(lang, true),
      order: [
        ['is_featured', 'DESC'],
        ['score', 'DESC'],
        ['likes', 'DESC'],
      ],
      limit: limit * 3,
    });

    const now = Date.now();
    const validArts = arts.filter(
      (art) =>
        !art.featured_until || new Date(art.featured_until).getTime() > now,
    );

    return this.getWeightedRandomSelection(validArts, limit).map((art) =>
      this.formatArtWithLocation(art.toJSON<Art>(), lang),
    );
  }

  async updateArt(id: number, dto: UpdateArtDTO) {
    const art = await this.artRepository.findByPk(id, {
      include: [{ model: Tag, as: 'tags' }],
    });
    if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

    try {
      const { tags, ...updateData } = dto;
      if (Object.keys(updateData).length) {
        await this.artRepository.update(updateData, { where: { id } });
      }
      if (tags !== undefined)
        await this.tagsService.updateTagsForArt(art, tags);
      await this.updateScore(id);
      return this.findArtWithLocation(id);
    } catch (e: unknown) {
      this.handleError(
        'updateArt',
        e,
        `Art update not success: ${e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error'}`,
      );
    }
  }

  async deleteArt(id: number) {
    const art = await this.artRepository.findByPk(id);
    if (!art) throw new HttpException('Art not found', HttpStatus.BAD_REQUEST);
    await art.destroy();
    return { success: true };
  }

  async moderateArt(moderateDto: ModerateArtDto, id: number) {
    const transaction = await this.sequelize.transaction();
    try {
      const art = await this.artRepository.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

      await this.artRepository.update(
        {
          moderate: JSON.stringify({
            moderate: moderateDto.moderate,
            moderator_id: moderateDto.moderator_id,
            errors: moderateDto.errors || {},
            moderated_at: new Date(),
            comment: moderateDto.comment || null,
            previous_moderate: this.parseModerate(art.moderate),
          }),
        },
        { where: { id }, transaction },
      );

      if (
        moderateDto.moderate &&
        this.parseModerate(art.moderate).moderate !== true &&
        art.status !== ART_STATUS.ARCHIVED
      ) {
        await this.notifyFollowers(
          art.author_id,
          art.id,
          art.title,
          transaction,
        );
      }
      await transaction.commit();
    } catch (e: unknown) {
      await transaction.rollback();
      this.handleError(
        'moderateArt',
        e,
        `Art moderate not success: ${e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error'}`,
      );
    }
    await this.updateScore(id);
    return this.findArtWithLocation(id);
  }

  async incrementView(artId: number, userId?: number): Promise<Art> {
    const art = await this.artRepository.findByPk(artId);
    if (!art)
      throw new HttpException('Произведение не найдено', HttpStatus.NOT_FOUND);

    if (!userId) {
      await art.increment('views', { by: 1 });
    } else if (!(await this.hasUserViewedToday(artId, userId))) {
      await art.increment('views', { by: 1 });
      await this.recordView(artId, userId);
    }

    await art.reload();
    await this.updateScore(artId);
    return art;
  }

  async addToFeatured(artId: number, days = this.FEATURED_DAYS): Promise<void> {
    const art = await this.artRepository.findByPk(artId);
    if (!art) return;

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    await art.update({ is_featured: true, featured_until: featuredUntil });
    await this.updateScore(artId);
  }

  async removeFromFeatured(artId: number): Promise<void> {
    const art = await this.artRepository.findByPk(artId);
    if (!art) return;

    await art.update({ is_featured: false, featured_until: null });
    await this.updateScore(artId);
  }

  async refreshFeaturedArts(): Promise<void> {
    await this.artRepository.update(
      { is_featured: false, featured_until: null },
      { where: { is_featured: true, featured_until: { [Op.lt]: new Date() } } },
    );

    const candidates = await this.artRepository.findAll({
      where: {
        is_featured: false,
        moderate: { [Op.ne]: null },
        status: { [Op.ne]: ART_STATUS.ARCHIVED },
      },
      order: [
        ['score', 'DESC'],
        ['likes', 'DESC'],
      ],
      limit: 10,
    });

    for (const art of candidates)
      await this.addToFeatured(art.id, this.FEATURED_DAYS);
    this.logger.log('info', `🔄 Обновлен топ: ${candidates.length} картин`);
  }

  async updateAllScores(): Promise<void> {
    const arts = await this.artRepository.findAll();
    for (const art of arts) {
      await art.update({ score: await this.calculateScore(art) });
    }
    this.logger.log('info', `✅ Обновлены скоры для ${arts.length} картин`);
  }

  async likeArt(userId: number, artId: number, req: Request) {
    const art = await this.artRepository.findByPk(artId, {
      include: [{ model: AuthorProfile, attributes: ['user_id'] }],
    });
    if (!art)
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);

    const user = await this.userRepository.findByPk(userId);
    if (!user)
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);

    const existing = await this.artLikeModel.findOne({
      where: { art_id: artId, user_id: userId },
    });

    if (existing) {
      await existing.destroy();
      await art.decrement('likes', { by: 1 });
      return { success: true, message: 'Лайк удален' };
    }

    const ip = req.ip || req.socket.remoteAddress || '';

    await this.artLikeModel.create({
      art_id: artId,
      user_id: userId,
      user_gender: user.gender,
      user_birthday: user.date_birthday,
      city_id: user.city_id,
      country_id: user.country_id,
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
    });

    await art.increment('likes', { by: 1 });

    const author = await this.authorProfileModel.findByPk(art.author_id);
    if (author) {
      await this.notificationService.createNotification(
        author.user_id,
        NotificationType.ART_LIKE,
        `${user.name} ${user.surname} оценил вашу картину "${art.title}"`,
        `/arts/${artId}`,
        artId,
        {
          user_id: userId,
          art_id: artId,
          author_id: art.author_id,
          actor_name: `${user.name} ${user.surname}`,
          art_title: art.title,
        },
      );
    }

    return { success: true, message: 'Лайк добавлен' };
  }

  async getArtLikes(artId: number, page = 1, limit = 20) {
    if (!(await this.artRepository.findByPk(artId))) {
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await this.artLikeModel.findAndCountAll({
      where: { art_id: artId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'surname', 'gender', 'date_birthday'],
        },
        { model: City, attributes: ['id', 'name_ru', 'name_en'] },
        { model: Country, attributes: ['id', 'name_ru', 'name_en'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows.map((row) => row.toJSON<ArtLike>()),
      total: count,
      pagination: this.buildPagination(count, page, limit),
    };
  }

  async getLikedArts(userId: number, page = 1, limit = 12, lang = 'ru') {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.artLikeModel.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Art,
          required: true,
          include: [
            {
              model: AuthorProfile,
              include: [{ model: User, attributes: ['id', 'name', 'surname'] }],
            },
            { model: City, attributes: ['id', 'name_ru', 'name_en'] },
            {
              model: Country,
              attributes: ['id', 'name_ru', 'name_en', 'iso2'],
            },
            { model: Genre },
            { model: Style },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const arts = rows
      .map((row) => row.art)
      .filter((art): art is Art => Boolean(art));

    return {
      arts: arts.map((art) =>
        this.formatArtWithLocation(art.toJSON<Art>(), lang),
      ),
      pagination: this.buildPagination(count, page, limit),
    };
  }

  async getArtLikesCount(artId: number) {
    const count = await this.artLikeModel.count({ where: { art_id: artId } });
    return { count };
  }

  async viewArt(userId: number | null, artId: number, req: Request) {
    const art = await this.artRepository.findByPk(artId);
    if (!art)
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);

    const user = userId ? await this.userRepository.findByPk(userId) : null;

    if (userId) {
      const existing = await this.artViewModel.findOne({
        where: {
          art_id: artId,
          user_id: userId,
          created_at: { [Op.gte]: new Date(Date.now() - this.VIEW_WINDOW_MS) },
        },
      });
      if (existing) return;
    }

    const ip = req.ip || req.socket.remoteAddress || '';

    await this.artViewModel.create({
      art_id: artId,
      user_id: userId || undefined,
      user_gender: user?.gender || null,
      user_age: user?.date_birthday
        ? this.calculateAge(user.date_birthday)
        : null,
      city_id: user?.city_id || null,
      country_id: user?.country_id || null,
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
    });

    await art.increment('views', { by: 1 });
  }

  async getArtViewsCount(artId: number) {
    const count = await this.artViewModel.count({ where: { art_id: artId } });
    return { count };
  }

  async searchArts(query: string, page = 1, limit = 20, lang: Lang = 'ru') {
    if (!query || query.trim().length < 2) {
      return { arts: [], pagination: this.buildPagination(0, page, limit) };
    }

    const q = `%${query.trim().toLowerCase()}%`;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.artRepository.findAndCountAll({
      where: {
        ...this.publicArtWhere(),
        [Op.or]: [
          { title: { [Op.iLike]: q } },
          { description: { [Op.iLike]: q } },
          { '$author.user.name$': { [Op.iLike]: q } },
          { '$author.user.surname$': { [Op.iLike]: q } },
        ],
      },
      include: [
        ...this.getDefaultIncludesWithLocation(lang, true),
        {
          model: AuthorProfile,
          as: 'author',
          required: true,
          where: { is_deleted: false },
          attributes: ['user_id', 'avatar_path'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'surname'],
              where: { is_deleted: false },
              required: true,
            },
          ],
        },
      ],
      order: [
        ['score', 'DESC'],
        ['likes', 'DESC'],
        ['views', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return {
      arts: rows.map((art) =>
        this.formatArtWithLocation(art.toJSON<Art>(), lang),
      ),
      pagination: this.buildPagination(count, page, limit),
    };
  }

  async getSimilarArts(artId: number, limit = 20, lang: Lang = 'ru') {
    const art = await this.artRepository.findByPk(artId, {
      include: [{ model: Tag, as: 'tags', attributes: ['id', 'name'] }],
    });

    if (!art?.tags?.length) return [];

    const tagIds = art.tags.map((t) => t.id);

    const similar = await this.artRepository.findAll({
      attributes: {
        include: [
          [
            this.sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM art_tags AS at
                            WHERE at.art_id = "Art"."id"
                              AND at.tag_id IN (${tagIds.join(',')})
                        )`),
            'matched_tags',
          ],
        ],
      },
      include: [
        ...this.getDefaultIncludesWithLocation(lang, true),
        {
          model: Tag,
          as: 'tags',
          where: { id: { [Op.in]: tagIds } },
          through: { attributes: [] },
          required: true,
        },
      ],
      where: {
        ...this.publicArtWhere(),
        id: { [Op.ne]: artId },
        status: { [Op.ne]: ART_STATUS.ARCHIVED },
      },
      order: [
        [this.sequelize.literal('matched_tags'), 'DESC'],
        ['score', 'DESC'],
      ],
      limit,
      subQuery: false,
      group: [
        'Art.id',
        'author.user_id',
        'author.user.id',
        'genre.id',
        'style.id',
        'tags.id',
        'country.id',
        'city.id',
      ],
    });

    return similar.map((a) =>
      this.formatArtWithLocation(a.toJSON<Art>(), lang),
    );
  }

  async incrementArtShares(
    artId: number,
  ): Promise<{ success: boolean; shares: number }> {
    const art = await this.artRepository.findByPk(artId);
    if (!art)
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);

    await art.increment('shares', { by: 1 });
    await art.reload();

    this.logger.log(
      'info',
      JSON.stringify({
        message: '🔄 Увеличено количество поделившихся',
        context: 'ArtsService.incrementArtShares',
        artId,
        shares: art.shares,
      }),
    );

    return { success: true, shares: art.shares };
  }

  async getArtShares(artId: number): Promise<{ shares: number }> {
    const art = await this.artRepository.findByPk(artId, {
      attributes: ['shares'],
    });
    if (!art)
      throw new HttpException('Картина не найдена', HttpStatus.NOT_FOUND);
    return { shares: art.shares };
  }

  private async notifyFollowers(
    artistId: number,
    artId: number,
    title: string,
    transaction?: Transaction,
  ) {
    const [followers, author] = await Promise.all([
      this.followModel.findAll({
        where: { author_id: artistId },
        include: [{ model: User, attributes: ['id'] }],
      }),
      this.authorProfileModel.findByPk(artistId, {
        include: [{ model: User, attributes: ['name', 'surname'] }],
      }),
    ]);

    if (!author) return;

    const message = `${author.user.name} ${author.user.surname} опубликовал новую работу "${title}"`;

    await Promise.all(
      followers.map((follow) =>
        this.notificationService.createNotification(
          follow.user_id,
          NotificationType.NEW_ART,
          message,
          `/arts/${artId}`,
          artId,
          {
            author_id: artistId,
            art_id: artId,
            actor_name: `${author.user.name} ${author.user.surname}`,
            art_title: title,
          },
          transaction,
        ),
      ),
    );
  }

  private async findArtWithLocation(id: number, lang = 'ru') {
    const art = await this.artRepository.findByPk(id, {
      include: this.getDefaultIncludesWithLocation(lang),
    });
    return art ? this.formatArtWithLocation(art.toJSON<Art>(), lang) : null;
  }

  private publicArtWhere() {
    return {
      status: { [Op.ne]: ART_STATUS.ARCHIVED },
      [Op.and]: this.sequelize.literal(
        `"Art"."moderate"::jsonb ->> 'moderate' = 'true'`,
      ),
    };
  }

  private getDefaultIncludesWithLocation(lang = 'ru', publicOnly = false) {
    return [
      ...this.getDefaultIncludes(publicOnly),
      ...this.getLocationIncludes(lang),
    ];
  }

  private getDefaultIncludes(publicOnly = false) {
    return [
      {
        model: AuthorProfile,
        required: publicOnly,
        ...(publicOnly && { where: { is_deleted: false } }),
        attributes: ['user_id', 'avatar_path', 'is_deleted'],
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'surname', 'is_deleted'],
            required: publicOnly,
            ...(publicOnly && { where: { is_deleted: false } }),
          },
        ],
      },
      { model: Genre, required: false, attributes: ['id', 'title'] },
      { model: Style, required: false, attributes: ['id', 'name'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name'] },
    ];
  }

  private getLocationIncludes(lang = 'ru') {
    const nameField = lang === 'ru' ? 'name_ru' : 'name_en';
    return [
      {
        model: Country,
        as: 'country',
        attributes: ['id', 'iso2', 'iso3', nameField],
        required: false,
      },
      {
        model: City,
        as: 'city',
        attributes: ['id', 'country_code', nameField],
        required: false,
      },
    ];
  }

  private formatArtWithLocation(art: Art, lang = 'ru') {
    const nameField = lang === 'ru' ? 'name_ru' : 'name_en';
    return {
      ...art,
      moderate: this.parseModerate(art.moderate),
      country: art.country
        ? {
            id: art.country.id,
            iso2: art.country.iso2,
            iso3: art.country.iso3,
            name:
              art.country[nameField] ||
              art.country.name_en ||
              art.country.name_ru,
          }
        : null,
      city: art.city
        ? {
            id: art.city.id,
            country_code: art.city.country_code,
            name: art.city[nameField] || art.city.name_en || art.city.name_ru,
          }
        : null,
    };
  }

  private buildArtData(dto: CreateArtDto, artistId: number) {
    return {
      title: dto.title,
      description: dto.description,
      cost: dto.cost ?? null,
      currency: dto.currency || null,
      likes: 0,
      date_published: dto.date_published,
      author_id: artistId,
      city_id: dto.city_id || null,
      country_id: dto.country_id || null,
      genre_id: dto.genre_id || null,
      style_id: dto.style_id || null,
      specifications: dto.specifications || null,
      is_adult: dto.is_adult || false,
      status: ART_STATUS.ON_SALE,
      tags: dto.tags || null,
    };
  }

  private parseModerate(moderate: string) {
    if (!moderate) return {} as Partial<ModerateObject>;
    try {
      return JSON.parse(moderate) as Partial<ModerateObject>;
    } catch {
      return {} as Partial<ModerateObject>;
    }
  }

  private async hasUserViewedToday(
    artId: number,
    userId: number,
  ): Promise<boolean> {
    const view = await this.artViewModel.findOne({
      where: {
        art_id: artId,
        user_id: userId,
        created_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    return !!view;
  }

  private async recordView(artId: number, userId: number): Promise<void> {
    await this.artViewModel.create({ art_id: artId, user_id: userId });
  }

  private calculateAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
    return age;
  }

  private async calculateScore(art: Art): Promise<number> {
    const author = await this.authorProfileModel.findOne({
      where: { user_id: art.author_id },
      include: [{ model: Subscription }],
    });

    const plan = author?.subscription?.plan as
      | keyof typeof this.PLAN_WEIGHT
      | undefined;
    const planWeight = plan ? this.PLAN_WEIGHT[plan] : 0;
    const freshnessWeight = Math.max(
      this.FRESHNESS_DAYS - this.getAgeInDays(art.date_published),
      0,
    );
    const featuredBonus = art.is_featured ? this.FEATURED_BONUS : 0;

    return (
      Math.round(
        ((art.likes || 0) * 5 +
          (art.views || 0) * 0.1 +
          planWeight +
          freshnessWeight +
          featuredBonus) *
          100,
      ) / 100
    );
  }

  private async updateScore(artId: number): Promise<void> {
    const art = await this.artRepository.findByPk(artId);
    if (!art) return;
    await art.update({ score: await this.calculateScore(art) });
  }

  private getWeightedRandomSelection(arts: Art[], limit: number): Art[] {
    if (arts.length <= limit) return arts;
    const seed = new Date().toDateString();
    return this.shuffleArray(arts, seed)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private shuffleArray(array: Art[], seed: string): Art[] {
    const shuffled = [...array];
    const random = this.seededRandom(seed);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private seededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private getAgeInDays(date: Date): number {
    return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  }

  private handleError(method: string, error: unknown, message: string): never {
    this.logger.error(
      `❌ ${method} failed:`,
      error instanceof Error
        ? error.stack
        : typeof error === 'string'
          ? error
          : 'Unknown error',
    );
    if (error instanceof HttpException) throw error;
    throw new HttpException(message, HttpStatus.BAD_REQUEST);
  }

  private async getArtsWithFilters(
    page: number,
    limit: number,
    lang: Lang,
    type: FilterType,
  ) {
    const offset = (page - 1) * limit;
    const where: WhereOptions<Art> = {};
    if (type === 'moderated') Object.assign(where, this.publicArtWhere());
    else if (type === 'unmoderated')
      where[Op.and] = this.sequelize.literal(
        `COALESCE("Art"."moderate"::jsonb ->> 'moderate', 'false') <> 'true'`,
      );
    const { count, rows } = await this.artRepository.findAndCountAll({
      where,
      include: this.getDefaultIncludesWithLocation(lang),
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });
    return {
      arts: rows.map((art) =>
        this.formatArtWithLocation(art.toJSON<Art>(), lang),
      ),
      pagination: this.buildPagination(count, page, limit),
    };
  }
}
