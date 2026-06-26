import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './users.model';
import { CreateUserDto } from './dto/create-user.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { PasswordService } from '../password/password.service';
import { UpdateuserDto } from './dto/update-user.dto';
import { ArtistProfile } from '../artists/artist.model';
import { Sequelize } from 'sequelize';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class UsersService {

    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private fileService: FilesService,
        private passwordService: PasswordService,
        private translationService: TranslationService
    ) { }

    async onModuleInit() {
        await this.createAdminIfNotExists();
    }
    private async createAdminIfNotExists() {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@mail.ru';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
        const adminName = process.env.ADMIN_NAME || 'Администратор';
        const adminSurname = process.env.ADMIN_SURNAME || 'Системный';
        const adminSecondName = process.env.ADMIN_SECOND_NAME || 'Системович';
        const adminPhone = process.env.ADMIN_PHONE || '+70000000000';

        try {
            const existingAdmin = await this.userRepository.findOne({
                where: { email: adminEmail }
            });

            if (!existingAdmin) {
                this.logger.log('info', JSON.stringify({
                    message: '🔧 Администратор не найден, начинаю создание',
                    context: 'UsersService.createAdminIfNotExists',
                    email: adminEmail
                }));


                const hashedPassword = await this.passwordService.hashPassword(adminPassword);

                const admin = await this.userRepository.create({
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    surname: adminSurname,
                    second_name: adminSecondName,
                    phone_number: adminPhone,
                    role: 'admin'
                });

                this.logger.log('info', JSON.stringify({
                    message: '✅ Администратор успешно создан',
                    context: 'UsersService.createAdminIfNotExists',
                    userId: admin.id,
                    email: admin.email,
                    role: admin.role
                }));

                console.log('\n🚀 =====================================');
                console.log('✅ Администратор успешно создан!');
                console.log('=====================================');
                console.log(`📧 Email: ${adminEmail}`);
                console.log(`🔑 Пароль: ${adminPassword}`);
                console.log(`👤 Имя: ${adminSurname} ${adminName} ${adminSecondName}`);
                console.log(`📞 Телефон: ${adminPhone}`);
                console.log(`🆔 ID: ${admin.id}`);
                console.log(`🎭 Роль: admin`);
                console.log('=====================================\n');
            } else {
                this.logger.log('debug', JSON.stringify({
                    message: 'ℹ️ Администратор уже существует, пропускаем создание',
                    context: 'UsersService.createAdminIfNotExists',
                    userId: existingAdmin.id,
                    email: existingAdmin.email
                }));

                console.log('\nℹ️ =====================================');
                console.log('ℹ️  Администратор уже существует');
                console.log('=====================================');
                console.log(`📧 Email: ${existingAdmin.email, await this.passwordService.comparePassword(adminPassword, existingAdmin.password)}`);
                console.log(`👤 Имя: ${existingAdmin.name}`);
                console.log(`🆔 ID: ${existingAdmin.id}`);
                console.log(`🎭 Роль: ${existingAdmin.role}`);
                console.log('=====================================\n');
            }
        } catch (error: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при создании администратора',
                context: 'UsersService.createAdminIfNotExists',
                error: error.message,
                stack: error.stack
            }));
            console.error('\n❌ Ошибка при создании администратора:', error.message);
        }
    }

    async createUser(dto: CreateUserDto, image?: any) {
        this.logger.log('info', JSON.stringify({
            message: '👤 Создание нового пользователя',
            context: 'UsersService.createUser',
            email: dto.email
        }));

        if (await this.getUserByEmail(dto.email)) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Пользователь с таким email уже существует',
                context: 'UsersService.createUser',
                email: dto.email
            }));
            throw new HttpException('Пользователь с такой почтой уже существует', 400);
        }

        let filename = "";
        if (image) {
            filename = await this.fileService.createFile(image);
        }

        const customUser: any = {};

        if (dto.email) customUser.email = dto.email;
        if (dto.password) customUser.password = await this.passwordService.hashPassword(dto.password);
        if (dto.name) customUser.name = dto.name;
        if (dto.surname) customUser.surname = dto.surname;
        if (dto.second_name) customUser.second_name = dto.second_name;
        if (dto.phone_number) customUser.phone_number = dto.phone_number;
        if (filename) customUser.avatar_path = filename;
        customUser.role = "user";

        this.logger.log('debug', JSON.stringify({
            message: '📝 Создание записи в БД',
            context: 'UsersService.createUser',
            email: dto.email,
            role: 'user'
        }));

        const user = await this.userRepository.create(customUser);
        const email = user.dataValues.email;

        this.logger.log('debug', JSON.stringify({
            message: '🔍 Поиск созданного пользователя',
            context: 'UsersService.createUser',
            email: email
        }));

        const newUser = await this.userRepository.findOne({ where: { email } });
        if (!newUser) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Пользователь не найден после создания',
                context: 'UsersService.createUser',
                email: email
            }));
            throw new Error('User not found after creation');
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь успешно создан',
            context: 'UsersService.createUser',
            userId: newUser.id,
            email: newUser.email
        }));

        return user;
    }

    async updateUser(id: number, dto: UpdateuserDto, image?: any) {
        this.logger.log('info', JSON.stringify({
            message: '✏️ Обновление пользователя',
            context: 'UsersService.updateUser',
            userId: id
        }));

        const user = await this.userRepository.findByPk(id);

        if (!user) {
            this.logger.log('warn', JSON.stringify({
                message: '❌ Пользователь не найден',
                context: 'UsersService.updateUser',
                userId: id
            }));
            throw new HttpException('Пользователь не найден', 404);
        }

        let filename = user.avatar_path;
        if (image) {
            if (user.avatar_path) {
                await this.fileService.removeFile(user.avatar_path);
            }
            filename = await this.fileService.createFile(image);
        }

        const updateData: any = {};
        if (dto?.email) updateData.email = dto.email;
        if (dto?.password) updateData.password = await this.passwordService.hashPassword(dto.password);
        if (dto?.name) updateData.name = dto.name;
        if (dto?.surname) updateData.surname = dto.surname;
        if (dto?.second_name) updateData.second_name = dto.second_name;
        if (dto?.phone_number) updateData.phone_number = dto.phone_number;
        if (filename) updateData.avatar_path = filename;

        await this.userRepository.update(updateData, { where: { id } });

        const updatedUser = await this.userRepository.findByPk(id);

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь успешно обновлен',
            context: 'UsersService.updateUser',
            userId: id,
            email: updatedUser?.email
        }));

        return updatedUser;
    }
    async deleteUserById(id: number): Promise<boolean> {
        this.logger.log('info', JSON.stringify({
            message: '🗑️ Начало удаления пользователя по ID',
            context: 'UsersService.deleteUserById',
            userId: id
        }));

        const user = await this.userRepository.findByPk(id);

        if (!user) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Невозможно удалить: пользователь не найден',
                context: 'UsersService.deleteUserById',
                userId: id
            }));
            return false;
        }

        const deletedCount = await this.userRepository.destroy({
            where: { id }
        });

        if (deletedCount > 0) {
            this.logger.log('info', JSON.stringify({
                message: '✅ Пользователь успешно удален',
                context: 'UsersService.deleteUserById',
                userId: id,
                email: user.email
            }));
            return true;
        } else {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении пользователя',
                context: 'UsersService.deleteUserById',
                userId: id
            }));
            return false;
        }
    }

    async getAllUsers(lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '📋 Запрос списка всех пользователей',
            context: 'UsersService.getAllUsers',
            lang
        }));

        let users = await this.userRepository.findAll();

        if (lang && lang !== 'ru') {
            users = await this.translationService.translateEntities(
                users,
                'user',
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Список пользователей получен',
            context: 'UsersService.getAllUsers',
            count: users.length,
            lang
        }));

        return users;
    }

    async getUserById(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Поиск пользователя по ID',
            context: 'UsersService.getUserById',
            userId: id,
            lang
        }));

        let user = await this.userRepository.findByPk(id, {
            attributes: ['id', 'name', 'surname', 'avatar_path'],
            include: [
                {
                    model: ArtistProfile,
                    as: 'artistProfile',
                    attributes: ['user_id'],
                }
            ],
            raw: true,
            nest: true
        });

        if (!user) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Пользователь не найден',
                context: 'UsersService.getUserById',
                userId: id
            }));
            return null;
        }

        if (lang && lang !== 'ru') {
            user = await this.translationService.translateEntity(
                user,
                'user',
                id,
                lang
            );
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь найден',
            context: 'UsersService.getUserById',
            userId: id,
            email: user.email,
            lang
        }));

        return user;
    }

    async getUserByEmail(email: string, lang: string = 'ru') {
        this.logger.log('debug', JSON.stringify({
            message: '🔍 Поиск пользователя по email',
            context: 'UsersService.getUserByEmail',
            email: email,
            lang
        }));

        try {
            let user = await this.userRepository.findOne({
                where: { email }
            });

            if (!user || !user.email) {
                this.logger.log('debug', JSON.stringify({
                    message: 'ℹ️ Пользователь не найден',
                    context: 'UsersService.getUserByEmail',
                    email: email
                }));
                return user;
            }

            let userData = user.dataValues;

            if (lang && lang !== 'ru') {
                userData = await this.translationService.translateEntity(
                    userData,
                    'user',
                    user.id,
                    lang
                );
            }

            this.logger.log('debug', JSON.stringify({
                message: '✅ Пользователь найден по email',
                context: 'UsersService.getUserByEmail',
                email: email,
                userId: user.id,
                lang
            }));

            return userData;

        } catch (e: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при поиске пользователя по email',
                context: 'UsersService.getUserByEmail',
                email: email,
                error: e
            }));
            return null;
        }
    }

    async getProfileData(id: number, lang: string = 'ru') {
        this.logger.log('info', JSON.stringify({
            message: '🔍 Получение данных профиля пользователя по ID',
            context: 'UsersService.getProfileData',
            userId: id,
            lang
        }));

        try {
            let user = await this.userRepository.findByPk(id, {
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Пользователь не найден',
                    context: 'UsersService.getProfileData',
                    userId: id
                }));
                return null;
            }

            if (lang && lang !== 'ru') {
                user = await this.translationService.translateEntity(
                    user,
                    'user',
                    id,
                    lang
                );
            }

            this.logger.log('info', JSON.stringify({
                message: '✅ Пользователь найден',
                context: 'UsersService.getProfileData',
                userId: id,
                role: user.role,
                hasArtistProfile: !!user.artistProfile,
                lang
            }));

            return user;

        } catch (error: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при получении профиля пользователя',
                context: 'UsersService.getProfileData',
                userId: id,
                error: error.message
            }));
            throw error;
        }
    }
}