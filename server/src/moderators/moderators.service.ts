import { Injectable, HttpException, HttpStatus, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Moderator } from './moderator.model';
import { User } from '../users/users.model';
import { CreateModeratorDto, UpdateModeratorDto } from "./dto/create-moderator.dto";
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import * as bcrypt from 'bcryptjs';
import { FilesService } from '../files/files.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class ModeratorsService {
    constructor(
        @InjectModel(Moderator) private moderatorRepository: typeof Moderator,
        @InjectModel(User) private userRepository: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private readonly sequelize: Sequelize,
        private readonly fileService: FilesService,
        private translationService: TranslationService
    ) { }

    async createModerator(dto: CreateModeratorDto, image: any, adminId: number) {
        this.logger.log('info', JSON.stringify({
            message: '👮 Создание нового модератора',
            context: 'ModeratorsService.createModerator',
            email: dto.email,
            adminId
        }));

        const transaction = await this.sequelize.transaction();

        try {
            const existUser = await this.userRepository.findOne({
                where: { email: dto.email },
                transaction
            });

            if (existUser) {
                throw new ConflictException('Пользователь с таким email уже существует');
            }

            const hashedPassword = await bcrypt.hash(dto.password, 10);

            let filename = "";
            if (image) {
                filename = await this.fileService.createFile(image);
            }

            const user = await this.userRepository.create({
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                surname: dto.surname,
                second_name: dto.second_name,
                phone_number: dto.phone_number,
                avatar_path: filename || "",
                role: 'moderator',
            }, { transaction });

            const moderator = await this.moderatorRepository.create({
                user_id: user.id,
                assigned_by: adminId
            }, { transaction });

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Модератор успешно создан',
                context: 'ModeratorsService.createModerator',
                moderatorId: moderator.id,
                userId: user.id
            }));

            return this.getModeratorById(moderator.id);

        } catch (e: any) {
            await transaction.rollback();
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }
    async deleteModerator(id: number) {
        this.logger.log('info', JSON.stringify({
            message: '🗑️ Удаление модератора',
            context: 'ModeratorsService.deleteModerator',
            moderatorId: id
        }));

        const transaction = await this.sequelize.transaction();

        try {
            // Находим модератора
            const moderator = await this.moderatorRepository.findOne({
                where: { id },
                transaction
            });

            if (!moderator) {
                throw new NotFoundException('Модератор не найден');
            }

            const userId = moderator.user_id;

            await this.moderatorRepository.destroy({
                where: { id },
                transaction
            });

            await this.userRepository.destroy({
                where: { id: userId },
                transaction
            });

            await transaction.commit();

            this.logger.log('info', JSON.stringify({
                message: '✅ Модератор удален',
                context: 'ModeratorsService.deleteModerator',
                moderatorId: id
            }));

            return { success: true, message: 'Модератор удален' };

        } catch (e: any) {
            await transaction.rollback();
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении модератора',
                context: 'ModeratorsService.deleteModerator',
                moderatorId: id,
                error: e.message
            }));
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }
    async getModeratorById(id: number, lang: string = 'ru') {
        try {
            this.logger.log('info', JSON.stringify({
                message: '🔍 Получение модератора по ID',
                context: 'ModeratorsService.getModeratorById',
                moderatorId: id,
                lang
            }));

            let moderator = await this.moderatorRepository.findOne({
                where: { id },
                include: [{
                    model: User,
                    attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt']
                }]
            });

            if (!moderator) {
                throw new NotFoundException('Модератор не найден');
            }

            let moderatorJson = moderator.toJSON();

            if (lang && lang !== 'ru') {
                moderatorJson = await this.translationService.translateEntity(
                    moderatorJson,
                    'moderator',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Модератор получен',
                context: 'ModeratorsService.getModeratorById',
                moderatorId: id,
                lang
            }));

            return moderatorJson;
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении модератора',
                context: 'ModeratorsService.getModeratorById',
                error: e.message
            }));
            throw e;
        }
    }

    async getModerators(page: number = 1, limit: number = 10, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка модераторов',
            context: 'ModeratorsService.getModerators',
            page,
            limit,
            lang
        }));

        const offset = (page - 1) * limit;

        const { count, rows } = await this.moderatorRepository.findAndCountAll({
            include: [{ model: User, attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'role'] }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            nest: true,
            raw: true
        });

        let data = rows;

        if (lang && lang !== 'ru') {
            data = await this.translationService.translateEntities(
                rows,
                'moderator',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Список модераторов получен',
            context: 'ModeratorsService.getModerators',
            count: data.length,
            lang
        }));

        return {
            data,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    }
}