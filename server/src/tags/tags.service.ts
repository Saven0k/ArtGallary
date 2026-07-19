import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from './tag.model';
import { Op } from 'sequelize';

@Injectable()
export class TagsService {
    constructor(
        @InjectModel(Tag) private tagRepository: typeof Tag,
    ) {}

    async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
        if (!tagNames || tagNames.length === 0) return [];

        // Ограничиваем количество тегов
        const limitedTags = tagNames.slice(0, 20);

        const tags: Tag[] = [];
        for (const name of limitedTags) {
            const normalizedName = name.trim().toLowerCase();
            if (!normalizedName) continue;

            const [tag] = await this.tagRepository.findOrCreate({
                where: { name: normalizedName },
                defaults: { name: normalizedName },
            });
            
            // Увеличиваем счетчик использования
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

    async updateTagsForArt(art: any, tagNames: string[]): Promise<void> {
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
}