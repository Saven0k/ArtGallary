import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from './tag.model';
import { Op } from 'sequelize';
import { Art } from 'src/arts/arts.model';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag) private tagRepository: typeof Tag,
    @InjectModel(Art) private artRepository: typeof Art,
  ) {}

  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) return [];

    const limitedTags = tagNames.slice(0, 20);

    const tags: Tag[] = [];
    for (const name of limitedTags) {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) continue;

      const [tag] = await this.tagRepository.findOrCreate({
        where: { name: normalizedName },
        defaults: { name: normalizedName },
      });

      await tag.increment('usage_count');
      tags.push(tag);
    }

    return tags;
  }

  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    return this.tagRepository.findAll({
      order: [['usage_count', 'DESC']],
      limit,
    });
  }

  async searchTags(query: string): Promise<Tag[]> {
    if (!query || query.length < 2) return [];

    return this.tagRepository.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`,
        },
      },
      limit: 10,
    });
  }

  async updateTagsForArt(art: Art, tagNames: string[]): Promise<void> {
    if (art.tags) {
      for (const tag of art.tags) {
        await tag.decrement('usage_count');
      }
      await art.$set('tags', []);
    }

    if (tagNames && tagNames.length > 0) {
      const tags = await this.findOrCreateTags(tagNames);
      await art.$set('tags', tags);
    }
  }
  async searchArtsByTags(
    tagNames: string[],
    page: number = 1,
    limit: number = 20,
  ) {
    if (!tagNames.length)
      return { arts: [], pagination: this.buildPagination(0, page, limit) };

    const normalized = tagNames
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const offset = (page - 1) * limit;

    // Находим id тегов
    const tags = await this.tagRepository.findAll({
      where: { name: { [Op.in]: normalized } },
      attributes: ['id'],
    });

    if (!tags.length)
      return { arts: [], pagination: this.buildPagination(0, page, limit) };

    const tagIds = tags.map((t) => t.id);

    // Ищем картины, у которых есть хотя бы один из этих тегов.
    // Сортировка: по количеству совпавших тегов (в Sequelize это делается
    // через отдельный запрос с группировкой), затем по score.
    const { count, rows } = await this.artRepository.findAndCountAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          where: { id: { [Op.in]: tagIds } },
          through: { attributes: [] },
          required: true,
        },
      ],
      order: [
        ['score', 'DESC'],
        ['likes', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    return {
      arts: rows,
      pagination: this.buildPagination(count, page, limit),
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
}
