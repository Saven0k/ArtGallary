// arts.service.ts
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
    ) { }

    async createArt(dto: CreateArtDto, imagePath: any, artistId: number) {
        this.logger.log('info', JSON.stringify({
            message: '🚀 Начало создания нового произведения искусства',
            context: 'ArtsService.createArt',
            artistId: artistId,
            title: dto.title
        }));

        // ✅ Валидация страны и города через внешний API
        if (dto.country_id) {
            await this.locationService.validateLocation(dto.country_id, dto.city_id);
        }

        const transaction = await this.sequelize.transaction();

        try {
            const fileName = await this.fileService.createFile(imagePath);

            this.logger.log('debug', JSON.stringify({
                message: '🖼️ Файл сохранен',
                context: 'ArtsService.createArt',
                fileName: fileName
            }));

            const moderateObject = {
                moderate: false,
                moderator_id: null,
                errors: {},
                moderated_at: null,
                comment: null
            };

            const art = await this.artRepository.create({
                title: dto.title,
                description: dto.description,
                cost: dto.cost || null,
                currency: dto.currency || null,
                image_path: fileName,
                likes: dto.likes || 0,
                date_published: dto.date_published,
                artist_id: artistId,
                city_id: dto.city_id || null,
                country_id: dto.country_id || null,
                genre_id: dto.genre_id || null,
                style_id: dto.style_id || null,
                specifications: dto.specifications || null,
                is_adult: dto.is_adult || false,
                moderate: JSON.stringify(moderateObject)
            }, { transaction });

            await transaction.commit();

            const artJson = art.toJSON();
            if (artJson.moderate) {
                try {
                    artJson.moderate = JSON.parse(artJson.moderate);
                } catch (e) {
                    artJson.moderate = null;
                }
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Произведение искусства успешно создано',
                context: 'ArtsService.createArt',
                artId: art.id,
                title: art.title
            }));

            return artJson;

        } catch (e: any) {
            await transaction.rollback();

            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при создании произведения искусства',
                context: 'ArtsService.createArt',
                error: e.message,
                stack: e.stack
            }));

            throw new HttpException(`Error creating art: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async deleteArt(id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Попытка удаления произведения искусства',
            context: 'ArtsService.deleteArt',
            artId: id
        }));

        const art = await this.artRepository.findByPk(id);
        if (!art) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Произведение искусства не найдено для удаления',
                context: 'ArtsService.deleteArt',
                artId: id
            }));
            throw new HttpException('Art not found', HttpStatus.BAD_REQUEST);
        }
        try {
            await art.destroy();

            this.logger.log('info', JSON.stringify({
                message: '✅ Произведение искусства успешно удалено',
                context: 'ArtsService.deleteArt',
                artId: id,
                title: art.title
            }));

            return { "success": true }
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении произведения искусства',
                context: 'ArtsService.deleteArt',
                artId: id,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException("Art delete not success", HttpStatus.BAD_REQUEST);
        }
    }

    async updateArt(id: number, dto: UpdateArtDTO) {
        this.logger.log('info', JSON.stringify({
            message: '✏️ Начало обновления произведения искусства',
            context: 'ArtsService.updateArt',
            artId: id,
            updateData: dto
        }));

        try {
            const [affectedCount] = await this.artRepository.update(dto, {
                where: { id }
            });

            if (affectedCount === 0) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Произведение искусства не найдено для обновления',
                    context: 'ArtsService.updateArt',
                    artId: id
                }));
                throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            }

            const updatedArt = await this.artRepository.findOne({
                where: { id },
                raw: false
            });

            this.logger.log('info', JSON.stringify({
                message: '✅ Произведение искусства успешно обновлено',
                context: 'ArtsService.updateArt',
                artId: id
            }));

            return updatedArt;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при обновлении произведения искусства',
                context: 'ArtsService.updateArt',
                artId: id,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Art update not success: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async moderateArt(moderateDto: ModerateArtDto, id: number) {
        this.logger.log('info', JSON.stringify({
            message: '⚖️ Начало модерации произведения искусства',
            context: 'ArtsService.moderateArt',
            artId: id,
            moderate: moderateDto.moderate,
            moderatorId: moderateDto.moderator_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const art = await this.artRepository.findByPk(id);

            if (!art) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Произведение искусства не найдено для модерации',
                    context: 'ArtsService.moderateArt',
                    artId: id
                }));
                throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            }

            let currentModerate = {};
            if (art.moderate) {
                try {
                    currentModerate = JSON.parse(art.moderate);
                } catch (e) {
                    currentModerate = {};
                }
            }

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

            if (affectedCount === 0) {
                throw new HttpException('Art not found', HttpStatus.NOT_FOUND);
            }

            await transaction.commit();

            const resultMessage = moderateDto.moderate ? 'одобрено' : 'отклонено';
            this.logger.log('info', JSON.stringify({
                message: `✅ Произведение искусства ${resultMessage}`,
                context: 'ArtsService.moderateArt',
                artId: id,
                moderate: moderateDto.moderate
            }));

            const updatedArt = await this.artRepository.findByPk(id);

            if (updatedArt && updatedArt.moderate) {
                try {
                    updatedArt.moderate = JSON.parse(updatedArt.moderate);
                } catch (e) {
                    updatedArt.moderate = null;
                }
            }

            return updatedArt;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при модерации произведения искусства',
                context: 'ArtsService.moderateArt',
                artId: id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();

            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException(`Art moderate not success: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async getArtById(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Поиск произведения искусства по ID',
            context: 'ArtsService.getArtById',
            artId: id,
            lang: lang
        }));

        const art = await this.artRepository.findByPk(id, {
            include: [
                {
                    model: ArtistProfile,
                    include: [User]
                },
                {
                    model: Genre,
                    required: false,
                    attributes: ['id', 'title']
                },
                {
                    model: Style,
                    required: false,
                    attributes: ['id', 'name']
                }
            ],
            raw: true,
            nest: true
        });

        if (art) {
            let cityData = null;
            let countryData = null;

            if (art.country_id) {
                countryData = await this.locationService.getCountryById(art.country_id, lang);
            }

            if (art.city_id && art.country_id) {
                const cities = await this.locationService.getCitiesByCountry(art.country_id, lang);
                cityData = cities.find(c => c.id === art.city_id) || null;
            }

            const enrichedArt = {
                ...art,
                city: cityData,
                country: countryData
            };

            let translatedArt = enrichedArt;
            if (lang && lang !== 'ru') {
                translatedArt = await this.translationService.translateEntity(
                    enrichedArt,
                    'art',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Произведение искусства найдено',
                context: 'ArtsService.getArtById',
                artId: id,
                title: translatedArt.title,
                lang: lang
            }));

            return translatedArt;
        } else {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Произведение искусства не найдено',
                context: 'ArtsService.getArtById',
                artId: id
            }));
            return null;
        }
    }

    async getAllArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка всех произведений искусства',
            context: 'ArtsService.getAllArts',
            page: page,
            limit: limit,
            lang: lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.artRepository.findAndCountAll({
                limit,
                offset,
                include: [
                    {
                        model: ArtistProfile,
                        required: false,
                        attributes: ['user_id'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'surname', 'avatar_path']
                            }
                        ]
                    },
                    {
                        model: Genre,
                        required: false,
                        attributes: ['id', 'title']
                    },
                    {
                        model: Style,
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['createdAt', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const countryIds = [...new Set(rows.map(art => art.country_id).filter(Boolean))];
            const countriesMap = new Map();
            const citiesMap = new Map();

            if (countryIds.length > 0) {
                for (const id of countryIds) {
                    const country = await this.locationService.getCountryById(id, lang);
                    if (country) countriesMap.set(id, country);
                }
            }

            if (countryIds.length > 0) {
                for (const countryId of countryIds) {
                    const cities = await this.locationService.getCitiesByCountry(countryId, lang);
                    cities.forEach(city => citiesMap.set(city.id, city));
                }
            }

            let formattedArts = rows.map(art => {
                return {
                    id: art.id,
                    title: art.title,
                    description: art.description,
                    image_path: art.image_path,
                    cost: art.cost,
                    currency: art.currency,
                    likes: art.likes,
                    specifications: art.specifications,
                    date_published: art.date_published,
                    moderate: art.moderate,
                    is_adult: art.is_adult,
                    artist: art.artist ? {
                        user_id: art.artist.user_id,
                        user: art.artist.user ? {
                            id: art.artist.user.id,
                            name: art.artist.user.name,
                            surname: art.artist.user.surname,
                            avatar_path: art.artist.user.avatar_path
                        } : null
                    } : null,
                    genre: art.genre,
                    style: art.style,
                    city_id: art.city_id,
                    country_id: art.country_id,
                    city: art.city_id ? citiesMap.get(art.city_id) || null : null,
                    country: art.country_id ? countriesMap.get(art.country_id) || null : null
                };
            });

            if (lang && lang !== 'ru') {
                formattedArts = await this.translationService.translateEntities(
                    formattedArts,
                    'art',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Список произведений искусства получен',
                context: 'ArtsService.getAllArts',
                count: formattedArts.length,
                lang: lang
            }));

            return {
                arts: formattedArts,
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                    hasNextPage: page < Math.ceil(count / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении списка произведений искусства',
                context: 'ArtsService.getAllArts',
                error: e.message
            }));
            throw new HttpException(`Error getting arts: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async getModeratedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка модерированных произведений искусства',
            context: 'ArtsService.getModeratedArts',
            page: page,
            limit: limit,
            lang: lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.artRepository.findAndCountAll({
                limit,
                offset,
                include: [
                    {
                        model: ArtistProfile,
                        required: false,
                        attributes: ['user_id'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'surname', 'avatar_path']
                            }
                        ]
                    },
                    {
                        model: Genre,
                        required: false,
                        attributes: ['id', 'title']
                    },
                    {
                        model: Style,
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['createdAt', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const moderatedArts = rows.filter(art => {
                if (!art.moderate) return false;
                try {
                    const moderateObj = JSON.parse(art.moderate);
                    return moderateObj.moderate === true;
                } catch {
                    return false;
                }
            });

            const countryIds = [...new Set(moderatedArts.map(art => art.country_id).filter(Boolean))];
            const countriesMap = new Map();
            const citiesMap = new Map();

            if (countryIds.length > 0) {
                for (const id of countryIds) {
                    const country = await this.locationService.getCountryById(id, lang);
                    if (country) countriesMap.set(id, country);
                }
            }

            if (countryIds.length > 0) {
                for (const countryId of countryIds) {
                    const cities = await this.locationService.getCitiesByCountry(countryId, lang);
                    cities.forEach(city => citiesMap.set(city.id, city));
                }
            }

            let formattedArts = moderatedArts.map(art => {
                return {
                    id: art.id,
                    title: art.title,
                    description: art.description,
                    image_path: art.image_path,
                    cost: art.cost,
                    currency: art.currency,
                    likes: art.likes,
                    specifications: art.specifications,
                    date_published: art.date_published,
                    moderate: art.moderate,
                    is_adult: art.is_adult,
                    artist: art.artist ? {
                        user_id: art.artist.user_id,
                        user: art.artist.user ? {
                            id: art.artist.user.id,
                            name: art.artist.user.name,
                            surname: art.artist.user.surname,
                            avatar_path: art.artist.user.avatar_path
                        } : null
                    } : null,
                    genre: art.genre,
                    style: art.style,
                    city_id: art.city_id,
                    country_id: art.country_id,
                    city: art.city_id ? citiesMap.get(art.city_id) || null : null,
                    country: art.country_id ? countriesMap.get(art.country_id) || null : null
                };
            });

            if (lang && lang !== 'ru') {
                formattedArts = await this.translationService.translateEntities(
                    formattedArts,
                    'art',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Список модерированных произведений искусства получен',
                context: 'ArtsService.getModeratedArts',
                count: formattedArts.length,
                lang: lang
            }));

            return {
                arts: formattedArts,
                pagination: {
                    page: page,
                    limit: limit,
                    total: moderatedArts.length,
                    totalPages: Math.ceil(moderatedArts.length / limit),
                    hasNextPage: page < Math.ceil(moderatedArts.length / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении модерированных произведений искусства',
                context: 'ArtsService.getModeratedArts',
                error: e.message
            }));
            throw new HttpException(`Error getting moderated arts: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async getUnmoderatedArts(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка немодерированных произведений искусства',
            context: 'ArtsService.getUnmoderatedArts',
            page: page,
            limit: limit,
            lang: lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.artRepository.findAndCountAll({
                limit,
                offset,
                include: [
                    {
                        model: ArtistProfile,
                        required: false,
                        attributes: ['user_id'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'surname', 'avatar_path']
                            }
                        ]
                    },
                    {
                        model: Genre,
                        required: false,
                        attributes: ['id', 'title']
                    },
                    {
                        model: Style,
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['createdAt', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const unmoderatedArts = rows.filter(art => {
                if (!art.moderate) return true;
                try {
                    const moderateObj = JSON.parse(art.moderate);
                    return moderateObj.moderate === false;
                } catch {
                    return true;
                }
            });

            const countryIds = [...new Set(unmoderatedArts.map(art => art.country_id).filter(Boolean))];
            const countriesMap = new Map();
            const citiesMap = new Map();

            if (countryIds.length > 0) {
                for (const id of countryIds) {
                    const country = await this.locationService.getCountryById(id, lang);
                    if (country) countriesMap.set(id, country);
                }
            }

            if (countryIds.length > 0) {
                for (const countryId of countryIds) {
                    const cities = await this.locationService.getCitiesByCountry(countryId, lang);
                    cities.forEach(city => citiesMap.set(city.id, city));
                }
            }

            let formattedArts = unmoderatedArts.map(art => {
                return {
                    id: art.id,
                    title: art.title,
                    description: art.description,
                    image_path: art.image_path,
                    cost: art.cost,
                    currency: art.currency,
                    likes: art.likes,
                    specifications: art.specifications,
                    date_published: art.date_published,
                    moderate: art.moderate,
                    is_adult: art.is_adult,
                    artist: art.artist ? {
                        user_id: art.artist.user_id,
                        user: art.artist.user ? {
                            id: art.artist.user.id,
                            name: art.artist.user.name,
                            surname: art.artist.user.surname,
                            avatar_path: art.artist.user.avatar_path
                        } : null
                    } : null,
                    genre: art.genre,
                    style: art.style,
                    city_id: art.city_id,
                    country_id: art.country_id,
                    city: art.city_id ? citiesMap.get(art.city_id) || null : null,
                    country: art.country_id ? countriesMap.get(art.country_id) || null : null
                };
            });

            if (lang && lang !== 'ru') {
                formattedArts = await this.translationService.translateEntities(
                    formattedArts,
                    'art',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Список немодерированных произведений искусства получен',
                context: 'ArtsService.getUnmoderatedArts',
                count: formattedArts.length,
                lang: lang
            }));

            return {
                arts: formattedArts,
                pagination: {
                    page: page,
                    limit: limit,
                    total: unmoderatedArts.length,
                    totalPages: Math.ceil(unmoderatedArts.length / limit),
                    hasNextPage: page < Math.ceil(unmoderatedArts.length / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении немодерированных произведений искусства',
                context: 'ArtsService.getUnmoderatedArts',
                error: e.message
            }));
            throw new HttpException(`Error getting unmoderated arts: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }

    async getArtsByArtist(artistId: number, page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос произведений искусства художника',
            context: 'ArtsService.getArtsByArtist',
            artistId: artistId,
            page: page,
            limit: limit,
            lang: lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.artRepository.findAndCountAll({
                where: { artist_id: artistId },
                limit,
                offset,
                include: [
                    {
                        model: ArtistProfile,
                        required: false,
                        attributes: ['user_id', 'biography', 'date_birthday'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'surname', 'avatar_path', 'email']
                            }
                        ]
                    },
                    {
                        model: Genre,
                        required: false,
                        attributes: ['id', 'title']
                    },
                    {
                        model: Style,
                        required: false,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['createdAt', 'DESC']],
                distinct: true
            });

            const countryIds = [...new Set(rows.map(art => art.country_id).filter(Boolean))];
            const countriesMap = new Map();
            const citiesMap = new Map();

            if (countryIds.length > 0) {
                for (const id of countryIds) {
                    const country = await this.locationService.getCountryById(id, lang);
                    if (country) countriesMap.set(id, country);
                }
            }

            if (countryIds.length > 0) {
                for (const countryId of countryIds) {
                    const cities = await this.locationService.getCitiesByCountry(countryId, lang);
                    cities.forEach(city => citiesMap.set(city.id, city));
                }
            }

            let formattedArts = rows.map(art => {
                const artJson = art.toJSON();

                let moderateData = null;
                if (artJson.moderate) {
                    try {
                        moderateData = JSON.parse(artJson.moderate);
                    } catch (e) {
                        moderateData = null;
                    }
                }

                return {
                    id: artJson.id,
                    title: artJson.title,
                    description: artJson.description,
                    image_path: artJson.image_path,
                    cost: artJson.cost,
                    currency: artJson.currency,
                    likes: artJson.likes,
                    specifications: artJson.specifications,
                    date_published: artJson.date_published,
                    moderate: moderateData,
                    is_adult: artJson.is_adult,
                    city_id: artJson.city_id,
                    country_id: artJson.country_id,
                    city: artJson.city_id ? citiesMap.get(artJson.city_id) || null : null,
                    country: artJson.country_id ? countriesMap.get(artJson.country_id) || null : null,
                    artist: artJson.artist ? {
                        user_id: artJson.artist.user_id,
                        user: artJson.artist.user ? {
                            id: artJson.artist.user.id,
                            name: artJson.artist.user.name,
                            surname: artJson.artist.user.surname,
                            avatar_path: artJson.artist.user.avatar_path
                        } : null
                    } : null,
                    genre: artJson.genre,
                    style: artJson.style
                };
            });

            if (lang && lang !== 'ru') {
                formattedArts = await this.translationService.translateEntities(
                    formattedArts,
                    'art',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Произведения искусства художника получены',
                context: 'ArtsService.getArtsByArtist',
                artistId: artistId,
                count: formattedArts.length,
                page: page,
                totalPages: Math.ceil(count / limit),
                lang: lang
            }));

            return {
                arts: formattedArts,
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                    hasNextPage: page < Math.ceil(count / limit),
                    hasPreviousPage: page > 1
                }
            };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении произведений искусства художника',
                context: 'ArtsService.getArtsByArtist',
                artistId: artistId,
                error: e.message
            }));
            throw new HttpException(`Error getting arts by artist: ${e.message}`, HttpStatus.BAD_REQUEST);
        }
    }
}