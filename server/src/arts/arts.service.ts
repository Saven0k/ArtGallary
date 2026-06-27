import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Art } from './arts.model';
import { CreateArtDto } from './dto/create-art.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FilesService } from '../files/files.service';
import { UpdateArtDTO } from './dto/update-art.dto';
import { User } from '../users/users.model';
import { ArtistProfile } from '../artists/artist.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Genre } from '../genres/genre.model';
import { Style } from '../styles/styles.model';
import { ModerateArtDto } from './dto/moderate-art.dto';
import { Sequelize, Transaction } from 'sequelize';
import { TranslationService } from 'src/translation/translation.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class ArtsService {
    constructor(
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        private fileService: FilesService,
        @InjectConnection() private sequelize: Sequelize,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService,
        private locationService: LocationService,
    ) {}
ч
    async createArt(dto: CreateArtDto, imagePath: any, artistId: number) {
        if (dto.country_id) await this.locationService.validateLocation(dto.country_id, dto.city_id);
        
        const transaction = await this.sequelize.transaction();
        try {
            const fileName = await this.fileService.createFile(imagePath);
            
            const art = await this.artRepository.create({
                ...this.buildArtData(dto, artistId),
                image_path: fileName,
                moderate: JSON.stringify({
                    moderate: false,
                    moderator_id: null,
                    errors: {},
                    moderated_at: null,
                    comment: null
                })
            }, { transaction });

            await transaction.commit();
            return this.formatArtResponse(art);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('createArt', e, `Error creating art: ${e.message}`);
        }
    }

    async updateArt(id: number, dto: UpdateArtDTO) {
        try {
            const [affectedCount] = await this.artRepository.update(dto, { where: { id } });
            if (affectedCount === 0) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            
            const updatedArt = await this.artRepository.findOne({ where: { id } });
            return updatedArt;
        } catch (e: any) {
            this.handleError('updateArt', e, `Art update not success: ${e.message}`);
        }
    }

    async deleteArt(id: number) {
        const art = await this.artRepository.findByPk(id);
        if (!art) throw new HttpException('Art not found', HttpStatus.BAD_REQUEST);
        
        try {
            await art.destroy();
            return { success: true };
        } catch (e: any) {
            this.handleError('deleteArt', e, 'Art delete not success');
        }
    }

    async moderateArt(moderateDto: ModerateArtDto, id: number) {
        const transaction = await this.sequelize.transaction();
        
        try {
            const art = await this.artRepository.findByPk(id);
            if (!art) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);

            const currentModerate = this.parseModerate(art.moderate);
            const moderateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null,
                previous_moderate: currentModerate
            };

            const [affectedCount] = await this.artRepository.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { id }, transaction }
            );
            
            if (affectedCount === 0) throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            
            await transaction.commit();
            
            const updatedArt = await this.artRepository.findByPk(id);
            return this.formatArtResponse(updatedArt);
        } catch (e: any) {
            await transaction.rollback();
            this.handleError('moderateArt', e, `Art moderate not success: ${e.message}`);
        }
    }

    async getArtById(id: number, lang: string = 'ru') {
        const art = await this.artRepository.findByPk(id, {
            include: [
                { model: ArtistProfile, include: [User] },
                { model: Genre, required: false, attributes: ['id', 'title'] },
                { model: Style, required: false, attributes: ['id', 'name'] }
            ],
            raw: true,
            nest: true
        });

        if (!art) {
            this.logger.warn(`⚠️ Art ${id} not found`);
            return null;
        }

        return this.enrichAndTranslateArt(art, id, lang);
    }

    async getAllArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, null);
    }

    async getModeratedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, true);
    }

    async getUnmoderatedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        return this.getArtsWithFilters(page, limit, lang, false);
    }

    async getArtsByArtist(artistId: number, page: number = 1, limit: number = 12, lang: string = 'ru') {
        const offset = (page - 1) * limit;
        
        const { count, rows } = await this.artRepository.findAndCountAll({
            where: { artist_id: artistId },
            limit,
            offset,
            include: this.getDefaultIncludes(),
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        const formattedArts = await this.enrichAndTranslateArts(rows, lang);
        
        return {
            arts: formattedArts,
            pagination: this.buildPagination(count, page, limit)
        };
    }

    // ============ ПРИВАТНЫЕ МЕТОДЫ ============

    private getDefaultIncludes() {
        return [
            {
                model: ArtistProfile,
                required: false,
                attributes: ['user_id'],
                include: [
                    { model: User, attributes: ['id', 'name', 'surname', 'avatar_path'] }
                ]
            },
            { model: Genre, required: false, attributes: ['id', 'title'] },
            { model: Style, required: false, attributes: ['id', 'name'] }
        ];
    }

    private async getArtsWithFilters(page: number, limit: number, lang: string, moderateStatus: boolean | null) {
        const offset = (page - 1) * limit;
        
        const { count, rows } = await this.artRepository.findAndCountAll({
            limit,
            offset,
            include: this.getDefaultIncludes(),
            order: [['createdAt', 'DESC']],
            distinct: true,
            raw: true,
            nest: true
        });

        let filteredArts = rows;
        if (moderateStatus !== null) {
            filteredArts = rows.filter(art => {
                if (!art.moderate) return moderateStatus === false;
                try {
                    const moderateObj = JSON.parse(art.moderate);
                    return moderateObj.moderate === moderateStatus;
                } catch {
                    return false;
                }
            });
        }

        const formattedArts = await this.enrichAndTranslateArts(filteredArts, lang);
        
        return {
            arts: formattedArts,
            pagination: this.buildPagination(filteredArts.length, page, limit)
        };
    }

    private buildArtData(dto: CreateArtDto, artistId: number) {
        return {
            title: dto.title,
            description: dto.description,
            cost: dto.cost || null,
            currency: dto.currency || null,
            likes: dto.likes || 0,
            date_published: dto.date_published,
            artist_id: artistId,
            city_id: dto.city_id || null,
            country_id: dto.country_id || null,
            genre_id: dto.genre_id || null,
            style_id: dto.style_id || null,
            specifications: dto.specifications || null,
            is_adult: dto.is_adult || false,
        };
    }

    private formatArtResponse(art: Art) {
        const artJson = art.toJSON();
        if (artJson.moderate) {
            try {
                artJson.moderate = JSON.parse(artJson.moderate);
            } catch {
                artJson.moderate = null;
            }
        }
        return artJson;
    }

    private parseModerate(moderate: string) {
        if (!moderate) return {};
        try {
            return JSON.parse(moderate);
        } catch {
            return {};
        }
    }

    private async enrichAndTranslateArt(art: any, id: number, lang: string) {
        const enriched = await this.enrichWithLocation(art, lang);
        
        if (lang && lang !== 'ru') {
            return this.translationService.translateEntity(enriched, 'art', id, lang);
        }
        
        return enriched;
    }

    private async enrichAndTranslateArts(arts: any[], lang: string) {
        const enrichedArts = await this.enrichWithLocationBatch(arts, lang);
        
        if (lang && lang !== 'ru') {
            return this.translationService.translateEntities(enrichedArts, 'art', lang);
        }
        
        return enrichedArts;
    }

    private async enrichWithLocation(art: any, lang: string) {
        let cityData = null;
        let countryData = null;

        if (art.country_id) {
            countryData = await this.locationService.getCountryById(art.country_id, lang);
        }
        if (art.city_id && art.country_id) {
            const cities = await this.locationService.getCitiesByCountry(art.country_id, lang);
            cityData = cities.find(c => c.id === art.city_id) || null;
        }

        return {
            ...art,
            city: cityData,
            country: countryData
        };
    }

    private async enrichWithLocationBatch(arts: any[], lang: string) {
        const countryIds = [...new Set(arts.map(a => a.country_id).filter(Boolean))];
        const countriesMap = new Map();
        const citiesMap = new Map();

        if (countryIds.length) {
            for (const id of countryIds) {
                const country = await this.locationService.getCountryById(id, lang);
                if (country) countriesMap.set(id, country);
            }
            for (const countryId of countryIds) {
                const cities = await this.locationService.getCitiesByCountry(countryId, lang);
                cities.forEach(city => citiesMap.set(city.id, city));
            }
        }

        return arts.map(art => ({
            ...art,
            city: art.city_id ? citiesMap.get(art.city_id) || null : null,
            country: art.country_id ? countriesMap.get(art.country_id) || null : null
        }));
    }

    private buildPagination(total: number, page: number, limit: number) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1
        };
    }

    private handleError(method: string, error: any, message: string): never {
        this.logger.error(`❌ ${method} failed:`, error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
}