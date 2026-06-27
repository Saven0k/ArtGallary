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
    private readonly userAttributes = [
        'id', 'email', 'name', 'surname', 'second_name',
        'phone_number', 'avatar_path', 'role', 'createdAt', 'updatedAt'
    ];

    constructor(
        @InjectModel(Moderator) private moderatorRepository: typeof Moderator,
        @InjectModel(User) private userRepository: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private readonly sequelize: Sequelize,
        private readonly fileService: FilesService,
        private translationService: TranslationService
    ) {}

    // ============ CRUD ============

    async createModerator(dto: CreateModeratorDto, image: any, adminId: number) {
        this.log('createModerator', { email: dto.email, adminId });

        const transaction = await this.sequelize.transaction();
        try {
            await this.checkEmailExists(dto.email, transaction);

            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const avatarPath = image ? await this.fileService.createFile(image) : "";

            const user = await this.userRepository.create({
                ...this.pick(dto, ['email', 'name', 'surname', 'second_name', 'phone_number']),
                password: hashedPassword,
                avatar_path: avatarPath,
                role: 'moderator',
            }, { transaction });

            const moderator = await this.moderatorRepository.create({
                user_id: user.id,
                assigned_by: adminId
            }, { transaction });

            await transaction.commit();
            this.log('created', { moderatorId: moderator.id, userId: user.id });

            return this.getModeratorById(moderator.id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('createModerator', e);
        }
    }

    async deleteModerator(id: number) {
        this.log('deleteModerator', { moderatorId: id });

        const transaction = await this.sequelize.transaction();
        try {
            const moderator = await this.moderatorRepository.findOne({
                where: { id },
                transaction
            });

            if (!moderator) {
                throw new NotFoundException('Модератор не найден');
            }

            const userId = moderator.user_id;

            await this.moderatorRepository.destroy({ where: { id }, transaction });
            await this.userRepository.destroy({ where: { id: userId }, transaction });

            await transaction.commit();
            this.log('deleted', { moderatorId: id });

            return { success: true, message: 'Модератор удален' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('deleteModerator', e);
        }
    }

    // ============ GETTERS ============

    async getModeratorById(id: number, lang: string = 'ru') {
        this.log('getModeratorById', { moderatorId: id, lang });

        let moderator = await this.moderatorRepository.findOne({
            where: { id },
            include: [{
                model: User,
                attributes: this.userAttributes
            }]
        });

        if (!moderator) {
            throw new NotFoundException('Модератор не найден');
        }

        let result = moderator.toJSON();
        // ✅ Исправлено: передаем id как number, метод сам обработает
        return this.translateIfNeeded(result, 'moderator', lang, id);
    }

    async getModerators(page: number = 1, limit: number = 10, lang: string = 'ru') {
        this.log('getModerators', { page, limit, lang });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.moderatorRepository.findAndCountAll({
            include: [{
                model: User,
                attributes: this.userAttributes
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        let data = rows.map(row => row.toJSON());
        data = await this.translateIfNeeded(data, 'moderator', lang);

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

    // ============ PRIVATE HELPERS ============

    private async checkEmailExists(email: string, transaction?: any) {
        const existing = await this.userRepository.findOne({
            where: { email },
            transaction
        });
        if (existing) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }
    }

    // ✅ Исправлен: id теперь может быть number или undefined
    private async translateIfNeeded(data: any, type: string, lang: string, id?: number) {
        if (lang && lang !== 'ru') {
            if (Array.isArray(data)) {
                return this.translationService.translateEntities(data, type, lang);
            }
            // Используем id из data, если не передан явно
            const entityId = id || data?.id;
            if (entityId) {
                // ✅ Приводим к числу, если нужно
                return this.translationService.translateEntity(data, type, Number(entityId), lang);
            }
            return data;
        }
        return data;
    }

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null) {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as Pick<T, K>);
    }

    private log(method: string, data?: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'ModeratorsService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ Ошибка в ${method}`,
            context: 'ModeratorsService',
            error: error.message,
            stack: error.stack,
        }));

        if (error instanceof HttpException || error instanceof ConflictException || error instanceof NotFoundException) {
            throw error;
        }

        throw new HttpException(
            `Ошибка в ${method}: ${error.message}`,
            HttpStatus.BAD_REQUEST
        );
    }
}