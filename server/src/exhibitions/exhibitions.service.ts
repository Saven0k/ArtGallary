// exhibitions.service.ts
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Exhibition } from './exhibition.model';
import { ExhibitionArt } from './exhibition-art.model';
import { Sequelize, Op } from 'sequelize';
import { FilesService } from '../files/files.service';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { Art } from '../arts/arts.model';
import { ArtistProfile } from '../artists/artist.model';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { ExhibitionArtist } from './exhibition-artist.model';
import { ExhibitionUser } from './exhibition-user.model';
import { Genre } from '../genres/genre.model';
import { ModerateExhibitionDto } from './dto/moderate-exhibition.dto';
import { TranslationService } from 'src/translation/translation.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class ExhibitionsService {
    constructor(
        @InjectModel(Exhibition) private exhibitionRepository: typeof Exhibition,
        @InjectModel(ExhibitionArt) private exhibitionArtRepository: typeof ExhibitionArt,
        @InjectModel(ArtistProfile) private artistRepository: typeof ArtistProfile,
        @InjectModel(ExhibitionArtist) private exhibitionArtistRepository: typeof ExhibitionArtist,
        @InjectModel(ExhibitionUser) private exhibitionUserRepository: typeof ExhibitionUser,
        @InjectModel(Genre) private genreRepository: typeof Genre,
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(Art) private artRepository: typeof Art,
        @InjectConnection() private sequelize: Sequelize,
        private fileService: FilesService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private translationService: TranslationService,
        private locationService: LocationService,
    ) { }

    async create(dto: CreateExhibitionDto, image?: any) {
        let userId = Number(dto.owner_id);
        this.logger.log('info', JSON.stringify({
            message: '🚀 Создание новой выставки',
            context: 'ExhibitionsService.create',
            title: dto.title,
            userId: userId
        }));

        if (dto.country_id) {
            await this.locationService.validateLocation(dto.country_id, dto.city_id);
        }

        const transaction = await this.sequelize.transaction();

        try {
            const artistProfile = await this.artistRepository.findOne({
                where: { user_id: userId }
            });

            if (!artistProfile) {
                throw new HttpException('Профиль художника не найден', 404);
            }

            let imageUrl = "";

            if (image) {
                imageUrl = await this.fileService.createFile(image);
            }

            const moderateObject = {
                moderate: false,
                moderator_id: null,
                errors: {},
                moderated_at: null,
                comment: null
            };

            const exhibition = await this.exhibitionRepository.create({
                title: dto.title,
                description: dto.description,
                address: dto.address,
                date: dto.date,
                cost: dto.cost,
                currency: dto.currency,
                moderate: JSON.stringify(moderateObject),
                city_id: dto.city_id,
                country_id: dto.country_id,
                genre_id: dto.genre_id,
                image_path: imageUrl,
                owner_id: userId
            }, { transaction });

            await this.exhibitionArtistRepository.create({
                exhibition_id: exhibition.id,
                artist_id: userId
            } as any, { transaction });

            await transaction.commit();

            const exhibitionJson = exhibition.toJSON();
            if (exhibitionJson.moderate) {
                try {
                    exhibitionJson.moderate = JSON.parse(exhibitionJson.moderate);
                } catch (e) {
                    exhibitionJson.moderate = null;
                }
            }

            return exhibitionJson;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при создании выставки',
                context: 'ExhibitionsService.create',
                error: e.message
            }));

            await transaction.rollback();
            throw new HttpException(`Ошибка создания выставки: ${e.message}`, 400);
        }
    }

    async update(id: number, dto: UpdateExhibitionDto, image?: any, userId?: number) {
        if (!dto) {
            throw new HttpException('Нет данных для обновления', 400);
        }

        if (!userId) {
            throw new HttpException('Не авторизован', 401);
        }

        if (dto.country_id) {
            await this.locationService.validateLocation(dto.country_id, dto.city_id);
        }

        try {
            const exhibition = await this.exhibitionRepository.findByPk(id);

            if (!exhibition) {
                throw new HttpException('Выставка не найдена', 404);
            }

            let artistProfile = await this.artistRepository.findOne({
                where: { user_id: userId }
            });

            if (!artistProfile) {
                artistProfile = await this.artistRepository.create({
                    user_id: userId,
                    biography: '',
                    date_birthday: null
                } as any);
            }

            const isOwner = exhibition.owner_id === artistProfile.id;
            const isOwnerByUserId = exhibition.owner_id === userId;

            if (!isOwner && !isOwnerByUserId) {
                throw new HttpException('У вас нет прав на редактирование этой выставки', 403);
            }

            const updateData: any = {};

            if (dto.title !== undefined && dto.title !== null) updateData.title = dto.title;
            if (dto.description !== undefined && dto.description !== null) updateData.description = dto.description;
            if (dto.address !== undefined && dto.address !== null) updateData.address = dto.address;
            if (dto.date !== undefined && dto.date !== null) updateData.date = dto.date;
            if (dto.cost !== undefined && dto.cost !== null) updateData.cost = dto.cost;
            if (dto.currency !== undefined && dto.currency !== null) updateData.currency = dto.currency;
            if (dto.visitors_count !== undefined && dto.visitors_count !== null) updateData.visitors_count = dto.visitors_count;
            if (dto.city_id !== undefined && dto.city_id !== null) updateData.city_id = dto.city_id;
            if (dto.country_id !== undefined && dto.country_id !== null) updateData.country_id = dto.country_id;
            if (dto.genre_id !== undefined && dto.genre_id !== null) updateData.genre_id = dto.genre_id;
            if (dto.likes !== undefined && dto.likes !== null) updateData.likes = dto.likes;
            if (dto.views !== undefined && dto.views !== null) updateData.views = dto.views;

            if (image) {
                const newImageUrl = await this.fileService.createFile(image);
                updateData.image_path = newImageUrl;
                if (exhibition.image_path) {
                    this.fileService.removeFile(exhibition.image_path).catch(console.error);
                }
            }

            if (Object.keys(updateData).length > 0) {
                await this.exhibitionRepository.update(updateData, {
                    where: { id }
                });
            }

            if (dto.artist_ids !== undefined && Array.isArray(dto.artist_ids)) {
                await this.exhibitionUserRepository.destroy({
                    where: { exhibition_id: id }
                });

                const ownerId = isOwner ? exhibition.owner_id : artistProfile.id;
                const allArtistIds = [...new Set([ownerId, ...dto.artist_ids])];

                for (const artistId of allArtistIds) {
                    if (artistId && !isNaN(artistId)) {
                        await this.exhibitionUserRepository.create({
                            exhibition_id: id,
                            artist_id: artistId
                        } as any);
                    }
                }
            }

            if (dto.art_ids !== undefined && Array.isArray(dto.art_ids)) {
                await this.exhibitionArtRepository.destroy({
                    where: { exhibition_id: id }
                });

                for (const artId of dto.art_ids) {
                    if (artId && !isNaN(artId)) {
                        await this.exhibitionArtRepository.create({
                            exhibition_id: id,
                            art_id: artId
                        } as any);
                    }
                }
            }

            const updatedExhibition = await this.exhibitionRepository.findByPk(id);

            return updatedExhibition;

        } catch (e: any) {
            if (e instanceof HttpException) {
                throw e;
            }

            throw new HttpException(`Ошибка обновления выставки: ${e.message}`, 400);
        }
    }

    async remove(id: number) {
        this.logger.log('info', JSON.stringify({
            message: '🗑️ Удаление выставки',
            context: 'ExhibitionsService.remove',
            exhibitionId: id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(id);

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${id} не найдена`);
            }

            await this.exhibitionArtistRepository.destroy({
                where: { exhibition_id: id },
                transaction
            });

            await this.exhibitionArtRepository.destroy({
                where: { exhibition_id: id },
                transaction
            });

            const deletedCount = await this.exhibitionRepository.destroy({
                where: { id },
                transaction
            });

            if (deletedCount === 0) {
                throw new HttpException('Не удалось удалить выставку', 400);
            }

            await transaction.commit();

            return { success: true, message: 'Выставка удалена' };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении выставки',
                context: 'ExhibitionsService.remove',
                exhibitionId: id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(
                `Ошибка при удалении выставки: ${e.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addArt(exhibition_id: number, art_id: number) {
        this.logger.log('info', JSON.stringify({
            message: '➕ Добавление картины на выставку',
            context: 'ExhibitionsService.addArt',
            exhibitionId: exhibition_id,
            artId: art_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(exhibition_id, { transaction });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const art = await this.artRepository.findByPk(art_id, { transaction });

            if (!art) {
                throw new NotFoundException(`Арт с ID ${art_id} не найден`);
            }

            const exhibitionRelative = await this.exhibitionArtRepository.findOne({
                where: {
                    exhibition_id,
                    art_id
                }, transaction
            });

            if (exhibitionRelative) {
                throw new HttpException(`Выставка с ID ${exhibition_id} уже содержит арт с ID ${art_id}`, 400);
            }

            await this.exhibitionArtRepository.create({
                exhibition_id: exhibition_id,
                art_id: art_id
            } as any, { transaction });

            await transaction.commit();

            return { success: true };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при добавлении картины на выставку',
                context: 'ExhibitionsService.addArt',
                exhibitionId: exhibition_id,
                artId: art_id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(
                `Ошибка при добавлении картины на выставку: ${e.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteArt(exhibition_id: number, art_id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '➖ Удаление картины с выставки',
            context: 'ExhibitionsService.deleteArt',
            exhibitionId: exhibition_id,
            artId: art_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(exhibition_id, { transaction });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const art = await this.artRepository.findByPk(art_id, { transaction });

            if (!art) {
                throw new NotFoundException(`Арт с ID ${art_id} не найден`);
            }

            const exhibitionRelative = await this.exhibitionArtRepository.findOne({
                where: {
                    exhibition_id,
                    art_id
                }, transaction
            });

            if (!exhibitionRelative) {
                throw new HttpException(`Выставка с ID ${exhibition_id} не содержит арт с ID ${art_id}`, 400);
            }

            await this.exhibitionArtRepository.destroy({
                where: {
                    exhibition_id,
                    art_id
                },
                transaction
            });

            await transaction.commit();

            return { success: true };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении картины с выставки',
                context: 'ExhibitionsService.deleteArt',
                exhibitionId: exhibition_id,
                artId: art_id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(
                `Ошибка при удалении картины с выставки: ${e.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addArtist(exhibition_id: number, artist_id: number) {
        this.logger.log('info', JSON.stringify({
            message: '➕ Добавление художника на выставку',
            context: 'ExhibitionsService.addArtist',
            exhibitionId: exhibition_id,
            artistId: artist_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(exhibition_id, { transaction });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const artist = await ArtistProfile.findOne({ where: { user_id: artist_id }, transaction });

            if (!artist) {
                throw new NotFoundException(`Художник с ID ${artist_id} не найден`);
            }

            const exhibitionRelative = await this.exhibitionArtistRepository.findOne({
                where: {
                    exhibition_id,
                    artist_id,
                }, transaction
            });

            if (exhibitionRelative) {
                throw new HttpException(`Выставка с ID ${exhibition_id} уже содержит артиста с ID ${artist_id}`, 400);
            }

            await this.exhibitionArtistRepository.create({
                exhibition_id: exhibition_id,
                artist_id
            } as any, { transaction });

            await transaction.commit();

            return true;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при добавлении художника на выставку',
                context: 'ExhibitionsService.addArtist',
                exhibitionId: exhibition_id,
                artistId: artist_id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(
                `Ошибка при добавлении художника на выставку: ${e.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteArtist(exhibition_id: number, artist_id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '➖ Удаление художника с выставки',
            context: 'ExhibitionsService.deleteArtist',
            exhibitionId: exhibition_id,
            artistId: artist_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(exhibition_id, { transaction });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const artist = await this.artistRepository.findByPk(artist_id, { transaction });

            if (!artist) {
                throw new NotFoundException(`Художник с ID ${artist_id} не найден`);
            }

            const exhibitionRelative = await this.exhibitionArtistRepository.findOne({
                where: {
                    exhibition_id,
                    artist_id
                }, transaction
            });

            if (!exhibitionRelative) {
                throw new HttpException(`Выставка с ID ${exhibition_id} не содержит художника с ID ${artist_id}`, 400);
            }

            await this.exhibitionArtistRepository.destroy({
                where: {
                    exhibition_id,
                    artist_id
                },
                transaction
            });

            await transaction.commit();

            return { success: true };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении художника с выставки',
                context: 'ExhibitionsService.deleteArtist',
                exhibitionId: exhibition_id,
                artistId: artist_id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(
                `Ошибка при удалении художника с выставки: ${e.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async signUp(exhibition_id: number, user_id: number) {
        this.logger.log('info', JSON.stringify({
            message: '📝 Регистрация пользователя на выставку',
            context: 'ExhibitionsService.signUp',
            exhibitionId: exhibition_id,
            userId: user_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibitions = await this.exhibitionRepository.findAll({
                where: { id: exhibition_id },
                transaction,
                limit: 1
            });

            const exhibition = exhibitions[0];

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const user = await this.userRepository.findByPk(user_id, { transaction });

            if (!user) {
                throw new NotFoundException(`Пользователь с ID ${user_id} не найден`);
            }

            const existingRegistration = await this.exhibitionUserRepository.findOne({
                where: {
                    exhibition_id,
                    user_id
                },
                transaction
            });

            if (existingRegistration) {
                throw new HttpException(`Пользователь уже зарегистрирован на эту выставку`, 400);
            }

            await this.exhibitionUserRepository.create({
                exhibition_id: exhibition_id,
                user_id: user_id
            }, { transaction });

            const currentCount = exhibition.visitors_count ?? 0;

            await this.exhibitionRepository.update(
                { visitors_count: currentCount + 1 },
                { where: { id: exhibition_id }, transaction }
            );

            await transaction.commit();

            return { success: true, message: 'Вы успешно записаны на выставку' };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при регистрации пользователя',
                context: 'ExhibitionsService.signUp',
                exhibitionId: exhibition_id,
                userId: user_id,
                error: e.message
            }));

            await transaction.rollback();
            throw new HttpException(`Ошибка при записи на выставку: ${e.message}`, 400);
        }
    }

    async cancelSignUp(exhibition_id: number, user_id: number) {
        this.logger.log('warn', JSON.stringify({
            message: '⚠️ Отмена регистрации пользователя',
            context: 'ExhibitionsService.cancelSignUp',
            exhibitionId: exhibition_id,
            userId: user_id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findByPk(exhibition_id, { transaction });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${exhibition_id} не найдена`);
            }

            const user = await this.userRepository.findByPk(user_id, { transaction });

            if (!user) {
                throw new NotFoundException(`Пользователь с ID ${user_id} не найден`);
            }

            const exhibitionRelative = await this.exhibitionUserRepository.findOne({
                where: {
                    exhibition_id,
                    user_id
                },
                transaction
            });

            if (!exhibitionRelative) {
                throw new HttpException(`Выставка с ID ${exhibition_id} не содержит пользователя с ID ${user_id}`, 400);
            }

            await this.exhibitionUserRepository.destroy({
                where: {
                    exhibition_id: exhibition_id,
                    user_id
                },
                transaction
            });

            const currentCount = exhibition.visitors_count;
            await this.exhibitionRepository.update(
                { visitors_count: currentCount - 1 },
                { where: { id: exhibition_id }, transaction }
            );

            await transaction.commit();

            return { success: true };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при отмене регистрации',
                context: 'ExhibitionsService.cancelSignUp',
                exhibitionId: exhibition_id,
                userId: user_id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();
            throw new HttpException(`Ошибка при отмене записи пользователя на выставку: ${e.message}`, 400);
        }
    }

    async moderate(moderateDto: ModerateExhibitionDto, id: number) {
        this.logger.log('info', JSON.stringify({
            message: '🛠️ Модерация выставки',
            context: 'ExhibitionsService.moderate',
            exhibitionId: id,
            moderatorId: moderateDto.moderator_id,
            status: moderateDto.moderate
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const exhibition = await this.exhibitionRepository.findOne({
                where: { id },
                transaction
            });

            if (!exhibition) {
                throw new NotFoundException(`Выставка с ID ${id} не найдена`);
            }

            let currentModerate = {};
            if (exhibition.moderate) {
                try {
                    currentModerate = JSON.parse(exhibition.moderate);
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

            const [affectedCount] = await this.exhibitionRepository.update(
                { moderate: JSON.stringify(moderateObject) },
                { where: { id }, transaction }
            );

            if (affectedCount === 0) {
                throw new NotFoundException(`Выставка с ID ${id} не найдена`);
            }

            await transaction.commit();

            const resultMessage = moderateDto.moderate ? 'одобрена' : 'отклонена';

            const updatedExhibition = await this.findOne(id);
            return updatedExhibition;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при модерации выставки',
                context: 'ExhibitionsService.moderate',
                exhibitionId: id,
                error: e.message,
                stack: e.stack
            }));

            await transaction.rollback();

            if (e instanceof NotFoundException) {
                throw e;
            }
            throw new HttpException(`Ошибка модерации выставки: ${e.message}`, 400);
        }
    }

    async checkSignUpStatus(exhibition_id: number, user_id: number): Promise<boolean> {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Проверка статуса регистрации пользователя',
            context: 'ExhibitionsService.checkSignUpStatus',
            exhibitionId: exhibition_id,
            userId: user_id
        }));

        try {
            const signUp = await this.exhibitionUserRepository.findOne({
                where: {
                    exhibition_id,
                    user_id
                }
            });

            return !!signUp;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при проверке статуса регистрации',
                context: 'ExhibitionsService.checkSignUpStatus',
                exhibitionId: exhibition_id,
                userId: user_id,
                error: e.message
            }));
            throw new HttpException(`Ошибка проверки статуса: ${e.message}`, 400);
        }
    }

    async findOne(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Получение выставки по ID',
            context: 'ExhibitionsService.findOne',
            exhibitionId: id,
            lang
        }));

        try {
            const exhibition = await this.exhibitionRepository.findByPk(id);

            if (!exhibition) {
                throw new HttpException('Выставка не найдена', HttpStatus.NOT_FOUND);
            }

            let cityData = null;
            let countryData = null;

            if (exhibition.country_id) {
                countryData = await this.locationService.getCountryById(exhibition.country_id, lang);
            }

            if (exhibition.city_id && exhibition.country_id) {
                const cities = await this.locationService.getCitiesByCountry(exhibition.country_id, lang);
                cityData = cities.find(c => c.id === exhibition.city_id) || null;
            }

            let genre: Genre | null = null;
            if (exhibition.genre_id) {
                genre = await this.genreRepository.findByPk(exhibition.genre_id, {
                    attributes: ['id', 'title']
                });
            }

            const exhibitionArts = await this.exhibitionArtRepository.findAll({
                where: { exhibition_id: id },
                include: [{
                    model: Art,
                    attributes: ['id', 'title', 'image_path', 'cost', 'likes', 'date_published']
                }],
                raw: true,
                nest: true
            });

            const arts = exhibitionArts
                .filter(item => item.art)
                .map(item => ({
                    id: item.art!.id,
                    title: item.art!.title,
                    image_path: item.art!.image_path,
                    cost: item.art!.cost,
                    likes: item.art!.likes,
                    date_published: item.art!.date_published
                }));

            const exhibitionArtists = await this.exhibitionArtistRepository.findAll({
                where: { exhibition_id: id },
                include: [{
                    model: ArtistProfile,
                    attributes: ['user_id', 'biography', 'date_birthday'],
                    include: [{
                        model: User,
                        attributes: ['id', 'name', 'surname', 'avatar_path', 'email', 'phone_number']
                    }]
                }],
                raw: true,
                nest: true
            });

            const artists = exhibitionArtists
                .filter(item => item.artistProfile)
                .map(item => ({
                    user_id: item.artistProfile!.user_id,
                    biography: item.artistProfile!.biography,
                    date_birthday: item.artistProfile!.date_birthday,
                    user: item.artistProfile!.user ? {
                        id: item.artistProfile!.user.id,
                        name: item.artistProfile!.user.name,
                        surname: item.artistProfile!.user.surname,
                        avatar_path: item.artistProfile!.user.avatar_path,
                        email: item.artistProfile!.user.email,
                        phone_number: item.artistProfile!.user.phone_number
                    } : null
                }));

            let moderateValue = false;
            if (exhibition.moderate) {
                try {
                    const parsed = JSON.parse(exhibition.moderate);
                    moderateValue = parsed.moderate === true;
                } catch (e: any) {
                    moderateValue = false;
                }
            }

            let result = {
                id: exhibition.id,
                title: exhibition.title,
                description: exhibition.description,
                address: exhibition.address,
                date: exhibition.date,
                cost: exhibition.cost,
                currency: exhibition.currency,
                image_path: exhibition.image_path,
                visitors_count: exhibition.visitors_count || 0,
                moderate: moderateValue,
                city_id: exhibition.city_id,
                country_id: exhibition.country_id,
                city: cityData,
                country: countryData,
                genre: genre ? {
                    id: genre.id,
                    name: genre.title
                } : null,
                arts,
                artists
            };

            if (lang && lang !== 'ru') {
                result = await this.translationService.translateEntity(
                    result,
                    'exhibition',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Выставка успешно получена',
                context: 'ExhibitionsService.findOne',
                exhibitionId: id,
                lang
            }));

            return result;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении выставки',
                context: 'ExhibitionsService.findOne',
                exhibitionId: id,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка при получении выставки: ${e.message}`, 500);
        }
    }

    async getAll(page: number = 1, limit: number = 10, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка выставок с пагинацией',
            context: 'ExhibitionsService.getAll',
            requestedPage: page,
            requestedLimit: limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.exhibitionRepository.findAndCountAll({
                limit,
                offset,
                order: [['date', 'DESC']]
            });

            if (rows.length === 0) {
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

            const exhibitionIds = rows.map(ex => ex.id);

            const countryIds = [...new Set(rows.map(ex => ex.country_id).filter(Boolean))];
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

            const genreIds = [...new Set(rows.map(ex => ex.genre_id).filter(Boolean))];
            const genres = genreIds.length > 0
                ? await this.genreRepository.findAll({
                    where: { id: genreIds },
                    attributes: ['id', 'title']
                })
                : [];
            const genreMap = new Map(genres.map(g => [g.id, { id: g.id, name: g.title }]));

            const artsByExhibition: Record<number, any[]> = {};

            for (const exhibitionId of exhibitionIds) {
                const exhibitionArts = await this.exhibitionArtRepository.findAll({
                    where: { exhibition_id: exhibitionId },
                    include: [{
                        model: Art,
                        attributes: ['id', 'title', 'image_path', 'cost', 'likes']
                    }],
                    raw: true,
                    nest: true
                });

                artsByExhibition[exhibitionId] = exhibitionArts
                    .filter(item => item.art)
                    .map(item => ({
                        id: item.art!.id,
                        title: item.art!.title,
                        image_path: item.art!.image_path,
                        cost: item.art!.cost,
                        likes: item.art!.likes
                    }));
            }

            const artistsByExhibition: Record<number, any[]> = {};

            for (const exhibitionId of exhibitionIds) {
                const exhibitionArtists = await this.exhibitionArtistRepository.findAll({
                    where: { exhibition_id: exhibitionId },
                    include: [{
                        model: ArtistProfile,
                        attributes: ['user_id'],
                        include: [{
                            model: User,
                            attributes: ['id', 'name', 'surname', 'avatar_path']
                        }]
                    }],
                    raw: true,
                    nest: true
                });

                artistsByExhibition[exhibitionId] = exhibitionArtists
                    .filter(item => item.artistProfile)
                    .map(item => ({
                        user_id: item.artistProfile!.user_id,
                        user: item.artistProfile!.user ? {
                            id: item.artistProfile!.user.id,
                            name: item.artistProfile!.user.name,
                            surname: item.artistProfile!.user.surname,
                            avatar_path: item.artistProfile!.user.avatar_path || null
                        } : null
                    }));
            }

            const totalPages = Math.ceil(count / limit);

            let formattedExhibitions = rows.map(exhibition => {
                return {
                    id: exhibition.id,
                    title: exhibition.title,
                    description: exhibition.description,
                    address: exhibition.address,
                    date: exhibition.date,
                    cost: exhibition.cost,
                    currency: exhibition.currency,
                    image_path: exhibition.image_path,
                    visitors_count: exhibition.visitors_count || 0,
                    moderate: exhibition.moderate,
                    city_id: exhibition.city_id,
                    country_id: exhibition.country_id,
                    city: exhibition.city_id ? citiesMap.get(exhibition.city_id) || null : null,
                    country: exhibition.country_id ? countriesMap.get(exhibition.country_id) || null : null,
                    genre: exhibition.genre_id && genreMap.has(exhibition.genre_id)
                        ? genreMap.get(exhibition.genre_id)!
                        : null,
                    arts: artsByExhibition[exhibition.id] || [],
                    artists: artistsByExhibition[exhibition.id] || []
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            return {
                data: formattedExhibitions,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении списка выставок',
                context: 'ExhibitionsService.getAll',
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка при получении списка выставок: ${e.message}`, 500);
        }
    }

    async getModeratedExhibitions(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка модерированных выставок',
            context: 'ExhibitionsService.getModeratedExhibitions',
            page,
            limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.exhibitionRepository.findAndCountAll({
                limit,
                offset,
                include: [
                    { model: Genre, attributes: ['id', 'title'] }
                ],
                order: [['date', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const publishedExhibitions = rows.filter(exhibition => {
                if (!exhibition.moderate) return false;
                try {
                    const moderateObj = JSON.parse(exhibition.moderate);
                    return moderateObj.moderate === true;
                } catch {
                    return false;
                }
            });

            const countryIds = [...new Set(publishedExhibitions.map(ex => ex.country_id).filter(Boolean))];
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

            let formattedExhibitions = publishedExhibitions.map(exhibition => {
                let moderateData = null;
                if (exhibition.moderate) {
                    try {
                        moderateData = JSON.parse(exhibition.moderate);
                    } catch (e) {
                        moderateData = null;
                    }
                }

                return {
                    id: exhibition.id,
                    title: exhibition.title,
                    description: exhibition.description,
                    address: exhibition.address,
                    date: exhibition.date,
                    cost: exhibition.cost,
                    image_path: exhibition.image_path,
                    visitors_count: exhibition.visitors_count || 0,
                    moderate: moderateData,
                    city_id: exhibition.city_id,
                    country_id: exhibition.country_id,
                    city: exhibition.city_id ? citiesMap.get(exhibition.city_id) || null : null,
                    country: exhibition.country_id ? countriesMap.get(exhibition.country_id) || null : null,
                    genre: exhibition.genre
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            const total = publishedExhibitions.length;
            const totalPages = Math.ceil(total / limit);

            return {
                data: formattedExhibitions,
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

    async getUnmoderatedExhibitions(page: number = 1, limit: number = 12, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка немодерированных выставок',
            context: 'ExhibitionsService.getUnmoderatedExhibitions',
            page,
            limit,
            lang
        }));

        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await this.exhibitionRepository.findAndCountAll({
                limit,
                offset,
                include: [
                    { model: Genre, attributes: ['id', 'title'] }
                ],
                order: [['createdAt', 'DESC']],
                distinct: true,
                raw: true,
                nest: true
            });

            const unmoderatedExhibitions = rows.filter(exhibition => {
                if (!exhibition.moderate) return true;
                try {
                    const moderateObj = JSON.parse(exhibition.moderate);
                    return !moderateObj.moderate;
                } catch {
                    return true;
                }
            });

            const countryIds = [...new Set(unmoderatedExhibitions.map(ex => ex.country_id).filter(Boolean))];
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

            let formattedExhibitions = unmoderatedExhibitions.map(exhibition => {
                let moderateData = null;
                if (exhibition.moderate) {
                    try {
                        moderateData = JSON.parse(exhibition.moderate);
                    } catch (e) {
                        moderateData = null;
                    }
                }

                return {
                    id: exhibition.id,
                    title: exhibition.title,
                    description: exhibition.description,
                    address: exhibition.address,
                    date: exhibition.date,
                    cost: exhibition.cost,
                    image_path: exhibition.image_path,
                    visitors_count: exhibition.visitors_count || 0,
                    moderate: moderateData,
                    city_id: exhibition.city_id,
                    country_id: exhibition.country_id,
                    city: exhibition.city_id ? citiesMap.get(exhibition.city_id) || null : null,
                    country: exhibition.country_id ? countriesMap.get(exhibition.country_id) || null : null,
                    genre: exhibition.genre
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            const total = unmoderatedExhibitions.length;
            const totalPages = Math.ceil(total / limit);

            return {
                data: formattedExhibitions,
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
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении немодерированных выставок',
                context: 'ExhibitionsService.getUnmoderatedExhibitions',
                error: e.message
            }));
            throw new HttpException(`Ошибка: ${e.message}`, 400);
        }
    }

    async getByOwnerId(ownerId: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🏛️ Запрос выставок по владельцу',
            context: 'ExhibitionsService.getByOwnerId',
            ownerId,
            lang
        }));

        try {
            const artistProfile = await this.artistRepository.findOne({
                where: { user_id: ownerId }
            });

            if (!artistProfile) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль художника не найден',
                    context: 'ExhibitionsService.getByOwnerId',
                    ownerId
                }));
                return [];
            }

            const exhibitions = await this.exhibitionRepository.findAll({
                where: { owner_id: artistProfile.id },
                include: [
                    {
                        model: ArtistProfile,
                        as: 'artists',
                        through: { attributes: [] }
                    },
                    {
                        model: Art,
                        as: 'arts',
                        through: { attributes: [] }
                    },
                    {
                        model: Genre,
                        as: 'genre'
                    }
                ],
                order: [['date', 'DESC']]
            });

            const countryIds = [...new Set(exhibitions.map(ex => ex.country_id).filter(Boolean))];
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

            let formattedExhibitions = exhibitions.map(exhibition => {
                const exhibitionJson = exhibition.toJSON();
                if (exhibitionJson.moderate) {
                    try {
                        exhibitionJson.moderate = JSON.parse(exhibitionJson.moderate);
                    } catch (e: any) {
                        exhibitionJson.moderate = "";
                    }
                }

                return {
                    ...exhibitionJson,
                    city_id: exhibitionJson.city_id,
                    country_id: exhibitionJson.country_id,
                    city: exhibitionJson.city_id ? citiesMap.get(exhibitionJson.city_id) || null : null,
                    country: exhibitionJson.country_id ? countriesMap.get(exhibitionJson.country_id) || null : null,
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Выставки владельца получены',
                context: 'ExhibitionsService.getByOwnerId',
                ownerId,
                count: formattedExhibitions.length,
                lang
            }));

            return formattedExhibitions;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении выставок владельца',
                context: 'ExhibitionsService.getByOwnerId',
                ownerId,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка получения выставок: ${e.message}`, 400);
        }
    }

    async getByParticipantArtistId(artistId: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '👥 Запрос выставок, где художник участвует (не владелец)',
            context: 'ExhibitionsService.getByParticipantArtistId',
            artistId,
            lang
        }));

        try {
            const artistProfile = await this.artistRepository.findOne({
                where: { user_id: artistId }
            });

            if (!artistProfile) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль художника не найден',
                    context: 'ExhibitionsService.getByParticipantArtistId',
                    artistId
                }));
                return [];
            }

            const exhibitionArtists = await this.exhibitionArtistRepository.findAll({
                where: { artist_id: artistProfile.id },
                include: [{
                    model: Exhibition,
                    required: true,
                    where: {
                        owner_id: { [Op.ne]: artistProfile.id }
                    }
                }]
            });

            const exhibitionIds = exhibitionArtists
                .filter(item => item.exhibition)
                .map(item => item.exhibition!.id);

            if (exhibitionIds.length === 0) {
                return [];
            }

            const exhibitions = await this.exhibitionRepository.findAll({
                where: { id: { [Op.in]: exhibitionIds } },
                include: [
                    { model: Genre, as: 'genre', attributes: ['id', 'title'] }
                ],
                order: [['date', 'DESC']]
            });

            const exhibitionIdList = exhibitions.map(ex => ex.id);

            const exhibitionArts = await this.exhibitionArtRepository.findAll({
                where: { exhibition_id: { [Op.in]: exhibitionIdList } },
                include: [{ model: Art, attributes: ['id', 'title', 'image_path', 'cost', 'likes'] }]
            });

            const exhibitionArtistsList = await this.exhibitionArtistRepository.findAll({
                where: { exhibition_id: { [Op.in]: exhibitionIdList } },
                include: [{
                    model: ArtistProfile,
                    attributes: ['user_id'],
                    include: [{ model: User, attributes: ['id', 'name', 'surname', 'avatar_path'] }]
                }]
            });

            const countryIds = [...new Set(exhibitions.map(ex => ex.country_id).filter(Boolean))];
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

            const artsByExhibition: Record<number, any[]> = {};
            exhibitionArts.forEach(item => {
                if (!artsByExhibition[item.exhibition_id]) artsByExhibition[item.exhibition_id] = [];
                if (item.art) {
                    artsByExhibition[item.exhibition_id].push({
                        id: item.art.id,
                        title: item.art.title,
                        image_path: item.art.image_path,
                        cost: item.art.cost,
                        likes: item.art.likes
                    });
                }
            });

            const artistsByExhibition: Record<number, any[]> = {};
            exhibitionArtistsList.forEach(item => {
                if (!artistsByExhibition[item.exhibition_id]) artistsByExhibition[item.exhibition_id] = [];
                if (item.artistProfile) {
                    artistsByExhibition[item.exhibition_id].push({
                        user_id: item.artistProfile.user_id,
                        user: item.artistProfile.user ? {
                            id: item.artistProfile.user.id,
                            name: item.artistProfile.user.name,
                            surname: item.artistProfile.user.surname,
                            avatar_path: item.artistProfile.user.avatar_path || null
                        } : null
                    });
                }
            });

            let formattedExhibitions = exhibitions.map(exhibition => {
                const exhibitionJson = exhibition.toJSON();
                let moderateValue = false;
                if (exhibitionJson.moderate) {
                    try {
                        const parsed = JSON.parse(exhibitionJson.moderate);
                        moderateValue = parsed.moderate === true;
                    } catch (e: any) { moderateValue = false; }
                }

                return {
                    id: exhibitionJson.id,
                    title: exhibitionJson.title,
                    description: exhibitionJson.description,
                    address: exhibitionJson.address,
                    date: exhibitionJson.date,
                    cost: exhibitionJson.cost,
                    image_path: exhibitionJson.image_path,
                    visitors_count: exhibitionJson.visitors_count || 0,
                    moderate: moderateValue,
                    owner_id: exhibitionJson.owner_id,
                    city_id: exhibitionJson.city_id,
                    country_id: exhibitionJson.country_id,
                    city: exhibitionJson.city_id ? citiesMap.get(exhibitionJson.city_id) || null : null,
                    country: exhibitionJson.country_id ? countriesMap.get(exhibitionJson.country_id) || null : null,
                    genre: exhibitionJson.genre,
                    arts: artsByExhibition[exhibitionJson.id] || [],
                    artists: artistsByExhibition[exhibitionJson.id] || []
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            return formattedExhibitions;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении выставок с участием художника',
                context: 'ExhibitionsService.getByParticipantArtistId',
                artistId,
                error: e.message
            }));
            throw new HttpException(`Ошибка получения выставок: ${e.message}`, 400);
        }
    }

    async getAllArtistExhibitions(artistId: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🎨 Запрос всех выставок художника (владелец + участник)',
            context: 'ExhibitionsService.getAllArtistExhibitions',
            artistId,
            lang
        }));

        try {
            const artistProfile = await this.artistRepository.findOne({
                where: { user_id: artistId }
            });

            if (!artistProfile) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Профиль художника не найден',
                    context: 'ExhibitionsService.getAllArtistExhibitions',
                    artistId
                }));
                return [];
            }

            const exhibitionIds = new Set<number>();

            const ownedExhibitionsRaw = await this.exhibitionRepository.findAll({
                where: { owner_id: artistProfile.user_id },
                attributes: ['id']
            });
            ownedExhibitionsRaw.forEach(ex => exhibitionIds.add(ex.id));

            const participatedExhibitionsRaw = await this.exhibitionArtistRepository.findAll({
                where: { artist_id: artistProfile.user_id },
                attributes: ['exhibition_id']
            });
            participatedExhibitionsRaw.forEach(item => exhibitionIds.add(item.exhibition_id));

            if (exhibitionIds.size === 0) {
                return [];
            }

            const exhibitions = await this.exhibitionRepository.findAll({
                where: { id: { [Op.in]: Array.from(exhibitionIds) } },
                include: [
                    { model: Genre, as: 'genre', attributes: ['id', 'title'] }
                ],
                order: [['date', 'DESC']],
                raw: true,
                nest: true
            });

            const exhibitionIdList = exhibitions.map(ex => ex.id);

            const exhibitionArts = await this.exhibitionArtRepository.findAll({
                where: { exhibition_id: { [Op.in]: exhibitionIdList } },
                include: [{
                    model: Art,
                    attributes: ['id', 'title', 'image_path', 'cost', 'likes', 'date_published']
                }],
                raw: true,
                nest: true
            });

            const exhibitionArtists = await this.exhibitionArtistRepository.findAll({
                where: { exhibition_id: { [Op.in]: exhibitionIdList } },
                include: [{
                    model: ArtistProfile,
                    attributes: ['user_id'],
                    include: [{
                        model: User,
                        attributes: ['id', 'name', 'surname', 'avatar_path']
                    }]
                }],
                raw: true,
                nest: true
            });

            const countryIds = [...new Set(exhibitions.map(ex => ex.country_id).filter(Boolean))];
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

            const artsByExhibition: Record<number, any[]> = {};
            exhibitionArts.forEach(item => {
                if (!artsByExhibition[item.exhibition_id]) {
                    artsByExhibition[item.exhibition_id] = [];
                }
                if (item.art) {
                    artsByExhibition[item.exhibition_id].push({
                        id: item.art.id,
                        title: item.art.title,
                        image_path: item.art.image_path,
                        cost: item.art.cost,
                        likes: item.art.likes,
                        date_published: item.art.date_published
                    });
                }
            });

            const artistsByExhibition: Record<number, any[]> = {};
            exhibitionArtists.forEach(item => {
                if (!artistsByExhibition[item.exhibition_id]) {
                    artistsByExhibition[item.exhibition_id] = [];
                }
                if (item.artistProfile) {
                    artistsByExhibition[item.exhibition_id].push({
                        user_id: item.artistProfile.user_id,
                        user: item.artistProfile.user ? {
                            id: item.artistProfile.user.id,
                            name: item.artistProfile.user.name,
                            surname: item.artistProfile.user.surname,
                            avatar_path: item.artistProfile.user.avatar_path || null
                        } : null
                    });
                }
            });

            let formattedExhibitions = exhibitions.map(exhibition => {
                let moderateValue = false;
                if (exhibition.moderate) {
                    try {
                        const parsed = JSON.parse(exhibition.moderate);
                        moderateValue = parsed.moderate === true;
                    } catch (e: any) {
                        moderateValue = false;
                    }
                }

                return {
                    id: exhibition.id,
                    title: exhibition.title,
                    description: exhibition.description,
                    address: exhibition.address,
                    date: exhibition.date,
                    cost: exhibition.cost,
                    image_path: exhibition.image_path,
                    visitors_count: exhibition.visitors_count || 0,
                    moderate: moderateValue,
                    owner_id: exhibition.owner_id,
                    city_id: exhibition.city_id,
                    country_id: exhibition.country_id,
                    city: exhibition.city_id ? citiesMap.get(exhibition.city_id) || null : null,
                    country: exhibition.country_id ? countriesMap.get(exhibition.country_id) || null : null,
                    genre: exhibition.genre,
                    arts: artsByExhibition[exhibition.id] || [],
                    artists: artistsByExhibition[exhibition.id] || []
                };
            });

            if (lang && lang !== 'ru') {
                formattedExhibitions = await this.translationService.translateEntities(
                    formattedExhibitions,
                    'exhibition',
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Все выставки художника получены',
                context: 'ExhibitionsService.getAllArtistExhibitions',
                artistId,
                count: formattedExhibitions.length,
                lang
            }));

            return formattedExhibitions;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении всех выставок художника',
                context: 'ExhibitionsService.getAllArtistExhibitions',
                artistId,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException(`Ошибка получения выставок: ${e.message}`, 400);
        }
    }

    async getUserRegisteredExhibitions(userId: number, lang: string = 'ru') {
        try {
            const exhibitionUsers = await this.exhibitionUserRepository.findAll({
                where: { user_id: userId },
                attributes: ['exhibition_id']
            });

            const exhibitionIds = exhibitionUsers.map(eu => eu.exhibition_id);

            if (exhibitionIds.length === 0) {
                return [];
            }

            let exhibitions = await this.exhibitionRepository.findAll({
                where: { id: exhibitionIds }
            });

            if (lang && lang !== 'ru') {
                exhibitions = await this.translationService.translateEntities(
                    exhibitions,
                    'exhibition',
                    lang
                );
            }

            return exhibitions;

        } catch (error) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении выставок пользователя',
                context: 'ExhibitionsService.getUserRegisteredExhibitions',
                userId: userId
            }));

            throw new HttpException(`Ошибка при получении выставок: `, 500);
        }
    }

    async getRegisteredUsersCount(exhibitionId: number): Promise<number> {
        try {
            const count = await this.exhibitionUserRepository.count({
                where: { exhibition_id: exhibitionId }
            });

            return count;
        } catch (error) {
            console.error('Error getting registered users count:', error);
            return 0;
        }
    }

    async isUserRegisteredToExhibition(exhibitionId: number, userId: number): Promise<boolean> {
        try {
            const registration = await this.exhibitionUserRepository.findOne({
                where: {
                    exhibition_id: exhibitionId,
                    user_id: userId
                }
            });

            return !!registration;
        } catch (error) {
            console.error('Error checking registration:', error);
            return false;
        }
    }
}