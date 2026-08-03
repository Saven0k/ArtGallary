// src/moderators/moderators.service.ts
import {
    Injectable, HttpException, HttpStatus,
    NotFoundException, ConflictException, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Moderator } from './moderator.model';
import { User } from '../users/users.model';
import { CreateModeratorDto } from './dto/create-moderator.dto';
import { UpdateModeratorDto } from './dto/update-moderator.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { FilesService } from '../files/files.service';
import { PasswordService } from '../password/password.service';

@Injectable()
export class ModeratorsService {

    // Атрибуты пользователя которые возвращаем (без пароля)
    private readonly USER_ATTRS = [
        'id', 'email', 'name', 'surname', 'second_name',
        'phone_number', 'avatar_path', 'role', 'gender',
        'is_deleted', 'country_id', 'city_id', 'createdAt', 'updatedAt',
    ];

    // include для всех запросов — только User
    // ✅ Country и City НЕ включаем через Sequelize include —
    // их таблицы созданы через raw SQL (сидер), и Sequelize не может делать JOIN с ними.
    // Локация (country_id, city_id) приходит в user как числа — фронт запрашивает
    // названия отдельно через /location/countries/by-code/:code и /location/cities/:id
    private get userInclude() {
        return {
            model: User,
            as: 'user',
            attributes: this.USER_ATTRS,
        };
    }

    constructor(
        @InjectModel(Moderator) private moderatorRepository: typeof Moderator,
        @InjectModel(User)      private userRepository: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        @InjectConnection() private readonly sequelize: Sequelize,
        private readonly fileService: FilesService,
        private readonly passwordService: PasswordService,
    ) {}

    // ── CREATE ───────────────────────────────────────────────────────────────

    async createModerator(dto: CreateModeratorDto, image: any, adminId: number) {
        this.log('createModerator', { email: dto.email, adminId });

        const transaction = await this.sequelize.transaction();
        try {
            // Проверка уникальности email
            const existing = await this.userRepository.findOne({
                where: { email: dto.email },
                transaction,
            });
            if (existing) throw new ConflictException('Пользователь с таким email уже существует');

            const avatarPath = image ? await this.fileService.createFile(image) : '';

            // ✅ Создаём пользователя — передаём ВСЕ поля включая gender
            const user = await this.userRepository.create({
                email:        dto.email,
                password:     await this.passwordService.hashPassword(dto.password),
                name:         dto.name,
                surname:      dto.surname,
                second_name:  dto.second_name || '',
                gender:       dto.gender,  
                role:         'moderator',
                avatar_path:  avatarPath,
            }, { transaction });

            // Создаём запись модератора
            const moderator = await this.moderatorRepository.create({
                user_id:     user.id,
                assigned_by: adminId ?? null,
            }, { transaction });

            await transaction.commit();
            this.log('createModerator:done', { moderatorId: moderator.id, userId: user.id });

            return this.getModeratorById(moderator.id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('createModerator', e);
        }
    }

    // ── READ ─────────────────────────────────────────────────────────────────

    async getModeratorById(id: number) {
        const moderator = await this.moderatorRepository.findOne({
            where: { id },
            include: [this.userInclude]
        });

        if (!moderator) throw new NotFoundException('Модератор не найден');
        return moderator.toJSON();
    }

    async getModeratorByUserId(userId: number) {
        const moderator = await this.moderatorRepository.findOne({
            where: { user_id: userId },
            include: [this.userInclude],
        });
        if (!moderator) throw new NotFoundException('Модератор не найден');
        return moderator.toJSON();
    }

    async getModerators(page: number = 1, limit: number = 10) {
        this.log('getModerators', { page, limit });

        const offset = (page - 1) * limit;
        const { count, rows } = await this.moderatorRepository.findAndCountAll({
            include: [this.userInclude],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        return {
            data: rows.map(r => r.toJSON()),
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                hasNextPage: page < Math.ceil(count / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Обновляет данные пользователя-модератора и/или assigned_by.
     * Пароль обновляется отдельно через хэширование.
     */
    async updateModerator(id: number, dto: UpdateModeratorDto, image?: any) {
        this.log('updateModerator', { moderatorId: id });

        const moderator = await this.moderatorRepository.findOne({ where: { id } });
        if (!moderator) throw new NotFoundException('Модератор не найден');

        const transaction = await this.sequelize.transaction();
        try {
            // Обновляем данные пользователя
            const userUpdate: any = {};
            if (dto.email        !== undefined) userUpdate.email        = dto.email;
            if (dto.name         !== undefined) userUpdate.name         = dto.name;
            if (dto.surname      !== undefined) userUpdate.surname      = dto.surname;
            if (dto.second_name  !== undefined) userUpdate.second_name  = dto.second_name;
            if (dto.phone_number !== undefined) userUpdate.phone_number = dto.phone_number;
            if (dto.gender       !== undefined) userUpdate.gender       = dto.gender;
            if (dto.password) {
                userUpdate.password = await this.passwordService.hashPassword(dto.password);
            }

            // Обновляем аватар если передан
            if (image) {
                const user = await this.userRepository.findByPk(moderator.user_id);
                if (user?.avatar_path) await this.fileService.removeFile(user.avatar_path);
                userUpdate.avatar_path = await this.fileService.createFile(image);
            }

            if (Object.keys(userUpdate).length > 0) {
                await this.userRepository.update(userUpdate, {
                    where: { id: moderator.user_id },
                    transaction,
                });
            }

            // Обновляем assigned_by если передан
            if (dto.assigned_by !== undefined) {
                await this.moderatorRepository.update(
                    { assigned_by: dto.assigned_by },
                    { where: { id }, transaction },
                );
            }

            await transaction.commit();
            this.log('updateModerator:done', { moderatorId: id });

            return this.getModeratorById(id);
        } catch (e) {
            await transaction.rollback();
            this.handleError('updateModerator', e);
        }
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    /**
     * Мягкое понижение — убирает запись модератора, меняет роль юзера на 'user'.
     * Пользователь НЕ удаляется, его данные сохраняются.
     */
    async deleteModerator(id: number) {
        this.log('deleteModerator', { moderatorId: id });

        const transaction = await this.sequelize.transaction();
        try {
            const moderator = await this.moderatorRepository.findOne({
                where: { id },
                transaction,
            });
            if (!moderator) throw new NotFoundException('Модератор не найден');

            // ✅ Меняем роль обратно на 'user' — данные сохраняются
            await this.userRepository.update(
                { role: 'user' },
                { where: { id: moderator.user_id }, transaction },
            );

            // Удаляем только запись модератора
            await this.moderatorRepository.destroy({ where: { id }, transaction });

            await transaction.commit();
            this.log('deleteModerator:done', { moderatorId: id, userId: moderator.user_id });

            return { success: true, message: 'Модератор понижен до пользователя' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('deleteModerator', e);
        }
    }

    /**
     * Жёсткое удаление — удаляет и модератора, и пользователя полностью.
     * Используй только если нужно полностью убрать аккаунт.
     */
    async hardDeleteModerator(id: number) {
        this.log('hardDeleteModerator', { moderatorId: id });

        const transaction = await this.sequelize.transaction();
        try {
            const moderator = await this.moderatorRepository.findOne({
                where: { id },
                transaction,
            });
            if (!moderator) throw new NotFoundException('Модератор не найден');

            const user = await this.userRepository.findByPk(moderator.user_id);

            // Удаляем аватар если есть
            if (user?.avatar_path) {
                try { await this.fileService.removeFile(user.avatar_path); } catch {}
            }

            await this.moderatorRepository.destroy({ where: { id }, transaction });
            await this.userRepository.destroy({ where: { id: moderator.user_id }, transaction });

            await transaction.commit();
            this.log('hardDeleteModerator:done', { moderatorId: id });

            return { success: true, message: 'Модератор и пользователь удалены' };
        } catch (e) {
            await transaction.rollback();
            this.handleError('hardDeleteModerator', e);
        }
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────

    private log(method: string, data?: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ModeratorsService.${method}`,
            context: 'ModeratorsService',
            ...data,
        }));
    }

    private handleError(method: string, error: any): never {
        this.logger.log('error', JSON.stringify({
            message: `❌ ModeratorsService.${method}`,
            context: 'ModeratorsService',
            error: error?.message,
        }));

        if (
            error instanceof HttpException ||
            error instanceof ConflictException ||
            error instanceof NotFoundException
        ) {
            throw error;
        }

        throw new HttpException(
            `Ошибка в ${method}: ${error?.message}`,
            HttpStatus.BAD_REQUEST,
        );
    }
}