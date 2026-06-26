import { ConflictException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/users.model';
import { ArtistProfile } from './artist.model';
import { Sequelize, Transaction } from 'sequelize';
import { CreateArtistDto } from './dto/create-artist.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import bcrypt from 'bcryptjs';
import { FilesService } from '../files/files.service';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { PasswordService } from '../password/password.service';
import { ModerateArtistDto } from './dto/modarate-artist.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Art } from '../arts/arts.model';
import { Exhibition } from '../exhibitions/exhibition.model';
import { Genre } from '../genres/genre.model';
import { ExhibitionArtist } from '../exhibitions/exhibition-artist.model';
import { TranslationService } from 'src/translation/translation.service';
import { LocationService } from 'src/location/location.service';
import { Style } from 'src/styles/styles.model';
import { ModerateObject, ModerateResponse } from 'src/types/moderate.types';

@Injectable()
export class ArtistsService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @InjectModel(ExhibitionArtist) private exhibitionArtistRepository: typeof ExhibitionArtist,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectConnection() private sequelize: Sequelize,
        private fileSerivce: FilesService,
        private passwordService: PasswordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService,
        private locationService: LocationService,
    ) { }

    async createArtist(dto: CreateArtistDto, image: any) {
        this.logger.log('info', JSON.stringify({
            message: '🚀 Начало создания нового артиста',
            context: 'ArtistsService.createArtist',
            email: dto.email,
            name: dto.name,
            surname: dto.surname,
        }));
        if (dto.country_id) {
            await this.locationService.validateLocation(dto.country_id, dto.city_id);
        }

        const transaction: Transaction = await this.sequelize.transaction();
        try {
            const existUser = await this.userRepository.findOne({ where: { email: dto.email }, transaction });
            if (existUser) {
                this.logger.warn(JSON.stringify({
                    message: '⚠️ Конфликт: пользователь с таким email уже существует',
                    context: 'ArtistsService.createArtist',
                    email: dto.email,
                    existingUserId: existUser.id
                }));
                throw new ConflictException('Пользователь с таким email уже существует');
            }

            const hashed_password = await bcrypt.hash(dto.password, 5);
            let filename = "";
            if (image) {
                filename = await this.fileSerivce.createFile(image);
            }

            const moderateObject = {
                moderate: false,
                moderator_id: null,
                errors: {},
            };

            this.logger.log('info', JSON.stringify({
                message: '👤 Создание пользователя с ролью artist',
                context: 'ArtistsService.createArtist',
                email: dto.email
            }));

            const user = await this.userRepository.create({
                email: dto.email,
                password: hashed_password,
                name: dto.name,
                surname: dto.surname,
                second_name: dto.second_name,
                phone_number: dto.phone_number,
                avatar_path: filename || "",
                role: 'artist',
            }, { transaction });

            await this.artistProfileModel.create({
                user_id: user.id,
                biography: dto.biography,
                date_birthday: dto.date_birthday,
                city_id: dto.city_id,
                country_id: dto.country_id,
                profession: dto.profession,
                moderate: JSON.stringify(moderateObject)
            }, { transaction });

            await transaction.commit();
            this.logger.log('info', `Артист успешно создан: ${user.id}`);

            return user.toJSON ? user.toJSON() : user;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при создании артиста',
                context: 'ArtistsService.createArtist',
                dto: {
                    email: dto.email,
                    name: dto.name,
                    surname: dto.surname
                }
            }));
            await transaction.rollback();
            throw new HttpException(`Ошибка создания артиста: ${e.message}`, 400);
        }
    }

    async updateArtist(id: number, dto: UpdateArtistDto, image: any) {
        if (dto.country_id) {
            await this.locationService.validateLocation(dto.country_id, dto.city_id);
        }

        const transaction: Transaction = await this.sequelize.transaction();
        try {
            this.logger.log('debug', JSON.stringify({
                message: '🔍 Поиск артиста для обновления',
                context: 'ArtistsService.updateArtist',
                artistId: id
            }));

            const user = await this.userRepository.findOne({
                where: { id }
            });

            if (!user) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Артист не найден для обновления',
                    context: 'ArtistsService.updateArtist',
                    artistId: id
                }));
                throw new HttpException("Артист не найден", 404);
            }

            if (dto.email && dto.email !== user.email) {
                const existUser = await this.userRepository.findOne({
                    where: { email: dto.email },
                    transaction
                });
                if (existUser) {
                    this.logger.log('warn', JSON.stringify({
                        message: '⚠️ Конфликт: email уже используется',
                        context: 'ArtistsService.updateArtist',
                        artistId: id,
                        email: dto.email
                    }));
                    throw new ConflictException('Пользователь с таким email уже существует');
                }
            }

            const userUpdateData: any = {};
            if (dto.email) userUpdateData.email = dto.email;
            if (dto.name) userUpdateData.name = dto.name;
            if (dto.surname) userUpdateData.surname = dto.surname;
            if (dto.second_name) userUpdateData.second_name = dto.second_name;
            if (dto.phone_number) userUpdateData.phone_number = dto.phone_number;
            if (dto.password) {
                userUpdateData.password = await this.passwordService.hashPassword(dto.password);
            }
            if (image) {
                this.logger.log('debug', JSON.stringify({
                    message: '🖼️ Обновление аватара',
                    context: 'ArtistsService.updateArtist',
                    artistId: id
                }));

                const newAvatarPath = await this.fileSerivce.createFile(image);
                userUpdateData.avatar_path = newAvatarPath;

                if (user.avatar_path) {
                    await this.fileSerivce.removeFile(user.avatar_path);
                }
            }

            if (Object.keys(userUpdateData).length > 0) {
                await this.userRepository.update(
                    userUpdateData,
                    {
                        where: { id: user.id },
                        transaction
                    }
                );
            }

            const artist = await this.artistProfileModel.findOne({
                where: { user_id: user.id },
                transaction
            });

            if (!artist) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль артиста не найден',
                    context: 'ArtistsService.updateArtist',
                    artistId: id
                }));
                throw new HttpException("Профиль артиста не найден", 404);
            }

            const profileUpdateData: any = {};
            if (dto.biography !== undefined) profileUpdateData.biography = dto.biography;
            if (dto.date_birthday !== undefined) profileUpdateData.date_birthday = dto.date_birthday;
            if (dto.city_id !== undefined) profileUpdateData.city_id = dto.city_id;
            if (dto.country_id !== undefined) profileUpdateData.country_id = dto.country_id;
            if (dto.likes !== undefined) profileUpdateData.likes = dto.likes;
            if (dto.views !== undefined) profileUpdateData.views = dto.views;
            if (dto.profession !== undefined) profileUpdateData.profession = dto.profession;

            if (Object.keys(profileUpdateData).length > 0) {
                await this.artistProfileModel.update(
                    profileUpdateData,
                    {
                        where: { user_id: user.id },
                        transaction
                    }
                );
            }

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Артист успешно обновлен',
                context: 'ArtistsService.updateArtist',
                artistId: id
            }));

            return await this.userRepository.findOne({
                where: { id: user.id },
                include: [{
                    model: this.artistProfileModel,
                    as: 'artistProfile'
                }],
                raw: true,
                nest: true
            });

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при обновлении артиста',
                context: 'ArtistsService.updateArtist',
                artistId: id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();

            if (e instanceof HttpException || e instanceof ConflictException) {
                throw e;
            }
            throw new HttpException(`Ошибка обновления артиста: ${e.message}`, 400);
        }
    }
    async deleteArtist(id: number) {
        const transaction: Transaction = await this.sequelize.transaction();

        try {
            // Находим пользователя с ролью artist
            const user = await this.userRepository.findOne({
                where: {
                    id,
                    role: "artist"
                },
                transaction
            });

            if (!user) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Артист не найден для удаления',
                    context: 'ArtistsService.deleteArtist',
                    artistId: id
                }));
                throw new NotFoundException('Артист не найден');
            }

            // Находим профиль артиста
            const artist = await this.artistProfileModel.findOne({
                where: { user_id: user.id },
                transaction
            });

            if (!artist) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль артиста не найден',
                    context: 'ArtistsService.deleteArtist',
                    artistId: id
                }));
                throw new NotFoundException('Профиль артиста не найден');
            }

            // Удаляем аватар если есть
            if (user.avatar_path) {
                this.logger.log('debug', JSON.stringify({
                    message: '🗑️ Удаление аватара',
                    context: 'ArtistsService.deleteArtist',
                    artistId: id,
                    avatarPath: user.avatar_path
                }));
                await this.fileSerivce.removeFile(user.avatar_path);
            }

            // Удаляем все картины художника (и их изображения)
            const arts = await this.artRepository.findAll({
                where: { artist_id: user.id },
                transaction
            });

            for (const art of arts) {
                if (art.image_path) {
                    await this.fileSerivce.removeFile(art.image_path);
                }
                await art.destroy({ transaction });
            }

            await this.exhibitionArtistRepository.destroy({
                where: { artist_id: artist.user_id },
                transaction
            });

            await artist.destroy({ transaction });

            await user.destroy({ transaction });

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Артист полностью удален вместе со всеми данными',
                context: 'ArtistsService.deleteArtist',
                artistId: id,
                email: user.email,
                artsCount: arts.length
            }));

            return {
                success: true,
                message: 'Артист полностью удален'
            };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении артиста',
                context: 'ArtistsService.deleteArtist',
                artistId: id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();

            if (e instanceof NotFoundException) {
                throw e;
            }
            throw new HttpException(`Ошибка удаления артиста: ${e.message}`, 400);
        }
    }
    async getArtistById(id: number, lang: string = 'ru') {
        try {
            this.logger.log('info', JSON.stringify({
                message: '🔍 Получение артиста по ID',
                context: 'ArtistsService.getArtistById',
                artistId: id,
                lang
            }));

            const user = await this.userRepository.findOne({
                where: {
                    id,
                    role: "artist"
                },
                attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt']
            });

            if (!user) {
                return null;
            }

            const artistProfile = await this.artistProfileModel.findOne({
                where: { user_id: id },
                raw: true,
                nest: true
            });

            const artsCount = await this.artRepository.count({
                where: { artist_id: id }
            });

            const exhibitionsCount = await this.exhibitionArtistRepository.count({
                where: { artist_id: artistProfile?.user_id }
            });

            const arts = await this.artRepository.findAll({
                where: { artist_id: id },
                attributes: ['likes']
            });
            const totalLikes = arts.reduce((sum, art) => sum + (art.likes || 0), 0);

            let moderateValue = null;
            if (artistProfile?.moderate) {
                try {
                    moderateValue = JSON.parse(artistProfile.moderate);
                } catch (e: any) {
                    moderateValue = null;
                }
            }

            let cityData = null;
            let countryData = null;

            if (artistProfile?.country_id) {
                countryData = await this.locationService.getCountryById(artistProfile.country_id, lang);
            }

            if (artistProfile?.city_id && artistProfile?.country_id) {
                const cities = await this.locationService.getCitiesByCountry(artistProfile.country_id, lang);
                cityData = cities.find(c => c.id === artistProfile.city_id) || null;
            }

            let result = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                second_name: user.second_name,
                phone_number: user.phone_number,
                avatar_path: user.avatar_path,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                artistProfile: artistProfile ? {
                    user_id: artistProfile.user_id,
                    date_birthday: artistProfile.date_birthday,
                    biography: artistProfile.biography,
                    moderate: moderateValue,
                    city_id: artistProfile.city_id,
                    country_id: artistProfile.country_id,
                    city: cityData,
                    country: countryData,
                    artsCount: artsCount,
                    exhibitionsCount: exhibitionsCount,
                    totalLikes: totalLikes,
                    profession: artistProfile.profession
                } : null
            };

            if (lang && lang !== 'ru') {
                result = await this.translationService.translateEntity(
                    result,
                    'artist',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Артист успешно получен',
                context: 'ArtistsService.getArtistById',
                artistId: id,
                lang
            }));

            return result;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при поиске артиста',
                error: e.message
            }));
            throw e;
        }
    }

    async getAll(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка художников с пагинацией',
            context: 'ArtistsService.getAll',
            requestedPage: page,
            requestedLimit: limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.userRepository.findAndCountAll({
                where: { role: "artist" },
                attributes: [
                    'id', 'email', 'name', 'surname', 'second_name',
                    'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt'
                ],
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true
            });

            const userIds = rows.map(user => user.id);

            if (userIds.length === 0) {
                return {
                    data: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: page > 1
                    }
                };
            }

            const artistProfiles = await this.artistProfileModel.findAll({
                where: { user_id: userIds },
                raw: true,
                nest: true
            });

            const artsByArtist: Record<number, any[]> = {};
            const arts = await this.artRepository.findAll({
                where: { artist_id: userIds },
                attributes: ['id', 'title', 'image_path', 'likes', 'date_published', 'artist_id'],
                limit: 5
            });

            arts.forEach(art => {
                const artistId = art.artist_id;
                if (!artsByArtist[artistId]) {
                    artsByArtist[artistId] = [];
                }
                artsByArtist[artistId].push({
                    id: art.id,
                    title: art.title,
                    image_path: art.image_path,
                    likes: art.likes,
                    date_published: art.date_published
                });
            });

            const profileMap = new Map();
            artistProfiles.forEach(profile => {
                profileMap.set(profile.user_id, profile);
            });

            // ✅ Массово загружаем страны и города
            const countryIds = [...new Set(artistProfiles.map(p => p.country_id).filter(Boolean))];
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

            let formattedArtists = rows.map(user => {
                const artistProfile = profileMap.get(user.id);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    surname: user.surname,
                    second_name: user.second_name,
                    phone_number: user.phone_number,
                    avatar_path: user.avatar_path,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    artistProfile: artistProfile ? {
                        user_id: artistProfile.user_id,
                        date_birthday: artistProfile.date_birthday,
                        biography: artistProfile.biography,
                        moderate: artistProfile.moderate,
                        is_deleted: artistProfile.is_deleted,
                        deleted_at: artistProfile.deleted_at,
                        createdAt: artistProfile.createdAt,
                        updatedAt: artistProfile.updatedAt,
                        city_id: artistProfile.city_id,
                        country_id: artistProfile.country_id,
                        city: artistProfile.city_id ? citiesMap.get(artistProfile.city_id) || null : null,
                        country: artistProfile.country_id ? countriesMap.get(artistProfile.country_id) || null : null,
                        arts: artsByArtist[user.id] || []
                    } : null
                };
            });

            if (lang && lang !== 'ru') {
                formattedArtists = await this.translationService.translateEntities(
                    formattedArtists,
                    'artist',
                    lang
                );
            }

            const totalPages = Math.ceil(count / limit);

            const result = {
                data: formattedArtists,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };

            this.logger.log('info', JSON.stringify({
                message: '✅ Список художников успешно получен',
                context: 'ArtistsService.getAll',
                pagination: {
                    currentPage: page,
                    pageSize: limit,
                    totalRecords: count,
                    totalPages
                },
                recordsReturned: rows.length,
                lang
            }));

            return result;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении списка художников',
                context: 'ArtistsService.getAll',
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка при получении списка художников: ${e.message}`, 400);
        }
    }

    async getUnmoderatedArtists(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка немодерированных артистов',
            context: 'ArtistsService.getUnmoderatedArtists',
            page,
            limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.userRepository.findAndCountAll({
                where: { role: "artist" },
                attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt'],
                include: [{
                    model: ArtistProfile,
                    required: true,
                    // ❌ Убираем include City и Country
                }],
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true
            });

            const unmoderatedArtists = rows.filter(user => {
                const moderate = user.artistProfile?.moderate;
                if (!moderate) return true;
                try {
                    const parsed = JSON.parse(moderate);
                    return !parsed.moderate;
                } catch {
                    return true;
                }
            });

            // ✅ Добавляем данные о локации
            const formattedArtists = await Promise.all(
                unmoderatedArtists.map(async (user) => {
                    let cityData = null;
                    let countryData = null;

                    if (user.artistProfile?.country_id) {
                        countryData = await this.locationService.getCountryById(user.artistProfile.country_id, lang);
                    }

                    if (user.artistProfile?.city_id && user.artistProfile?.country_id) {
                        const cities = await this.locationService.getCitiesByCountry(user.artistProfile.country_id, lang);
                        cityData = cities.find(c => c.id === user.artistProfile.city_id) || null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        surname: user.surname,
                        second_name: user.second_name,
                        phone_number: user.phone_number,
                        avatar_path: user.avatar_path,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        artistProfile: {
                            user_id: user.artistProfile.user_id,
                            date_birthday: user.artistProfile.date_birthday,
                            biography: user.artistProfile.biography,
                            moderate: user.artistProfile.moderate,
                            city_id: user.artistProfile.city_id,
                            country_id: user.artistProfile.country_id,
                            city: cityData,
                            country: countryData
                        }
                    };
                })
            );

            if (lang && lang !== 'ru') {
                return this.translationService.translateEntities(
                    formattedArtists,
                    'artist',
                    lang
                );
            }

            const total = formattedArtists.length;
            const totalPages = Math.ceil(total / limit);

            return {
                data: formattedArtists,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };

        } catch (e: any) {
            throw new HttpException(`Ошибка: ${e.message}`, 400);
        }
    }

    async getModeratedArtists(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка модерированных артистов',
            context: 'ArtistsService.getModeratedArtists',
            page,
            limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.userRepository.findAndCountAll({
                where: { role: "artist" },
                attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt'],
                include: [{
                    model: ArtistProfile,
                    required: true,
                }],
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const moderatedArtists = rows.filter(user => {
                const moderate = user.artistProfile?.moderate;
                if (!moderate) return false;
                try {
                    const parsed = JSON.parse(moderate);
                    return parsed.moderate === true;
                } catch {
                    return false;
                }
            });

            // ✅ Добавляем данные о локации
            const formattedArtists = await Promise.all(
                moderatedArtists.map(async (user) => {
                    let cityData = null;
                    let countryData = null;

                    if (user.artistProfile?.country_id) {
                        countryData = await this.locationService.getCountryById(user.artistProfile.country_id, lang);
                    }

                    if (user.artistProfile?.city_id && user.artistProfile?.country_id) {
                        const cities = await this.locationService.getCitiesByCountry(user.artistProfile.country_id, lang);
                        cityData = cities.find(c => c.id === user.artistProfile.city_id) || null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        surname: user.surname,
                        second_name: user.second_name,
                        phone_number: user.phone_number,
                        avatar_path: user.avatar_path,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        artistProfile: {
                            user_id: user.artistProfile.user_id,
                            date_birthday: user.artistProfile.date_birthday,
                            biography: user.artistProfile.biography,
                            moderate: user.artistProfile.moderate,
                            city_id: user.artistProfile.city_id,
                            country_id: user.artistProfile.country_id,
                            city: cityData,
                            country: countryData
                        }
                    };
                })
            );

            if (lang && lang !== 'ru') {
                return this.translationService.translateEntities(
                    formattedArtists,
                    'artist',
                    lang
                );
            }

            const total = formattedArtists.length;
            const totalPages = Math.ceil(total / limit);

            return {
                data: formattedArtists,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };

        } catch (e: any) {
            throw new HttpException(`Ошибка: ${e.message}`, 400);
        }
    }

    async getArtsByArtist(artistId: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🖼️ Получение работ артиста',
            context: 'ArtistsService.getArtsByArtist',
            artistId,
            lang
        }));

        try {
            const artistProfile = await this.artistProfileModel.findOne({
                where: { user_id: artistId }
            });

            if (!artistProfile) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль художника не найден',
                    context: 'ArtistsService.getArtsByArtist',
                    artistId
                }));
                return [];
            }

            let arts = await this.artRepository.findAll({
                where: { artist_id: artistProfile.user_id },
                include: [
                    {
                        model: Genre,
                        attributes: ['id', 'title']
                    },
                    {
                        model: Style,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['createdAt', 'DESC']],
                raw: true,
                nest: true
            });

            if (lang && lang !== 'ru') {
                arts = await this.translationService.translateEntities(
                    arts,
                    'art',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Работы артиста получены',
                context: 'ArtistsService.getArtsByArtist',
                artistId,
                count: arts.length,
                lang
            }));

            return arts;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении работ артиста',
                context: 'ArtistsService.getArtsByArtist',
                artistId,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка получения работ: ${e.message}`, 400);
        }
    }

    async getExhibitionsByArtist(artistId: number, lang: string = 'ru') {
        try {
            this.logger.log('info', JSON.stringify({
                message: '🖼️ Получение выставок артиста',
                context: 'ArtistsService.getExhibitionsByArtist',
                artistId,
                lang
            }));

            const artist = await this.artistProfileModel.findOne({
                where: { user_id: artistId },
                include: [
                    {
                        model: Exhibition
                    }
                ]
            });

            if (!artist) {
                this.logger.warn(JSON.stringify({
                    message: '⚠️ Артист не найден',
                    context: 'ArtistsService.getExhibitionsByArtist',
                    artistId
                }));
                throw new NotFoundException('Артист не найден');
            }

            let exhibitions = artist.exhibitions;

            if (lang && lang !== 'ru') {
                exhibitions = await this.translationService.translateEntities(
                    exhibitions,
                    'exhibition',
                    lang
                );
            }

            return exhibitions;

        } catch (e: any) {
            this.logger.error(JSON.stringify({
                message: '❌ Ошибка при получении выставок артиста',
                context: 'ArtistsService.getExhibitionsByArtist',
                artistId,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка получения выставок: ${e.message}`, 400);
        }
    }
    async moderateArtist(moderateDto: ModerateArtistDto, artist_id: number): Promise<ModerateResponse> {
        this.logger.log('info', JSON.stringify({
            message: '⚖️ Начало модерации артиста',
            context: 'ArtistsService.moderateArtist',
            artistId: artist_id,
            moderatorId: moderateDto.moderator_id,
            moderate: moderateDto.moderate
        }));

        const transaction: Transaction = await this.sequelize.transaction();

        try {
            // Находим профиль артиста через findAll с raw: false
            const artists = await this.artistProfileModel.findAll({
                where: { user_id: artist_id },
                limit: 1,
                transaction
            });

            const artist = artists[0];

            if (!artist) {
                throw new NotFoundException('Профиль артиста не найден');
            }

            const moderateObject: ModerateObject = {
                moderate: moderateDto.moderate,
                moderator_id: moderateDto.moderator_id,
                errors: moderateDto.errors || {},
                moderated_at: new Date(),
                comment: moderateDto.comment || null
            };

            // Обновляем через update метод репозитория напрямую
            const [affectedCount] = await this.artistProfileModel.update(
                { moderate: JSON.stringify(moderateObject) },
                {
                    where: { user_id: artist_id },
                    transaction
                }
            );

            if (affectedCount === 0) {
                throw new NotFoundException('Профиль артиста не найден');
            }

            await transaction.commit();

            const resultMessage = moderateDto.moderate ? 'прошел модерацию' : 'отклонен';
            this.logger.log('info', JSON.stringify({
                message: `✅ Артист ${resultMessage}`,
                context: 'ArtistsService.moderateArtist',
                artistId: artist_id
            }));

            return {
                success: true,
                message: moderateDto.moderate ? 'Артист прошел модерацию' : 'Артист отклонен',
                data: moderateObject
            };
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при модерации артиста',
                context: 'ArtistsService.moderateArtist',
                artistId: artist_id,
                error: e.message
            }));

            await transaction.rollback();

            if (e instanceof NotFoundException) throw e;
            throw new HttpException(`Ошибка модерации артиста: ${e.message}`, 400);
        }
    }
}
