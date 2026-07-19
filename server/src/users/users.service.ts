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

@Injectable()
export class UsersService {

    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private fileService: FilesService,
        private passwordService: PasswordService,
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
            const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });

            if (!existingAdmin) {
                const hashedPassword = await this.passwordService.hashPassword(adminPassword);
                const admin = await this.userRepository.create({
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    surname: adminSurname,
                    second_name: adminSecondName,
                    phone_number: adminPhone,
                    role: 'admin',
                    gender: 'M',
                    avatar_path: '', 
                });

                this.logger.log('info', JSON.stringify({
                    message: '✅ Администратор успешно создан',
                    context: 'UsersService.createAdminIfNotExists',
                    userId: admin.id,
                    email: admin.email,
                    role: admin.role
                }));
            }
            console.log('\n🚀 =====================================');
            console.log('✅ Администратор успешно создан!');
            console.log('=====================================');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Пароль: ${adminPassword}`);
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
        if (await this.getUserByEmail(dto.email)) throw new HttpException('Пользователь с такой почтой уже существует', 400);
        const filename = image ? await this.fileService.createFile(image) : "";
        const user = await this.userRepository.create({
            ...dto,
            password: await this.passwordService.hashPassword(dto.password),
            avatar_path: filename,
            role: "user",
        });

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь успешно создан',
            context: 'UsersService.createUser',
            userId: user.id,
            email: user.email
        }));
        return user;
    }

    async updateUser(id: number, dto: UpdateuserDto, image?: any) {
        const user = await this.userRepository.findByPk(id);
        if (!user) throw new HttpException('Пользователь не найден', 404);

        let filename = user.avatar_path;
        if (image) {
            if (user.avatar_path) await this.fileService.removeFile(user.avatar_path);
            filename = await this.fileService.createFile(image);
        }
        const updateData: any = {};
        if (dto?.email) updateData.email = dto.email;
        if (dto?.password) updateData.password = await this.passwordService.hashPassword(dto.password);
        if (dto?.name) updateData.name = dto.name;
        if (dto?.surname) updateData.surname = dto.surname;
        if (dto?.second_name) updateData.second_name = dto.second_name;
        if (dto?.phone_number) updateData.phone_number = dto.phone_number;
        if (dto?.gender) updateData.gender = dto.gender;
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
        const user = await this.userRepository.findByPk(id);
        if (!user) return false;
        if (user.is_deleted) throw new HttpException('Пользователь уже удален', 400);

        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        await user.update({ is_deleted: true, deleted_at: new Date(), });
        if (artistProfile) {
            await artistProfile.update({
                is_deleted: true,
                deleted_at: new Date(),
            });
        }
        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь скрыт (мягкое удаление)',
            context: 'UsersService.deleteUserById',
            userId: id,
            email: user.email,
            hasArtistProfile: !!artistProfile
        }));
        return true;
    }

    async restoreUser(id: number): Promise<User | null> {
        const user = await this.userRepository.findByPk(id);
        if (!user) throw new HttpException('Пользователь не найден', 404);
        if (!user.is_deleted) throw new HttpException('Пользователь не был удален', 400);

        if (user.deleted_at) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            if (user.deleted_at < oneYearAgo) {
                await this.permanentDeleteUser(user.id);
                throw new HttpException('Срок восстановления истек (более года)', 410);
            }
        }

        await user.update({ is_deleted: false, deleted_at: null, });

        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        if (artistProfile) await artistProfile.update({ is_deleted: false, deleted_at: null, });

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь восстановлен',
            context: 'UsersService.restoreUser',
            userId: id,
            email: user.email
        }));
        return user;
    }

    async permanentDeleteUser(id: number): Promise<boolean> {
        const user = await this.userRepository.findByPk(id);
        if (!user) return false;
        if (user.avatar_path) await this.fileService.removeFile(user.avatar_path);
        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        if (artistProfile) await artistProfile.destroy({ force: true });
        await user.destroy({ force: true });
        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь окончательно удален (перманентно)',
            context: 'UsersService.permanentDeleteUser',
            userId: id,
            email: user.email
        }));
        return true;
    }


    async getAllUsers() {
        const users = await this.userRepository.findAll({ where: { is_deleted: false } });
        this.logger.log('info', JSON.stringify({
            message: '✅ Список пользователей получен',
            context: 'UsersService.getAllUsers',
            count: users.length
        }));
        return users;
    }

    async getUserById(id: number, includeDeleted: boolean = false) {
        const where: any = { id };
        if (!includeDeleted) {
            where.is_deleted = false;
        }

        const user = await this.userRepository.findOne({
            where,
            attributes: ['id', 'email', 'name', 'surname', 'second_name', 'phone_number', 'avatar_path', 'gender', 'role', 'is_deleted', 'deleted_at', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: ArtistProfile,
                    as: 'artistProfile',
                    attributes: ['user_id', 'date_birthday', 'biography', 'moderate', 'profession', 'plan', 'planExpiresAt', 'playStatus', 'city_id', 'country_id', 'likes', 'views', 'is_deleted', 'deleted_at'],
                }
            ]
        });

        if (!user) return null;
        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь найден',
            context: 'UsersService.getUserById',
            userId: id,
            email: user.email
        }));
        return user;
    }

    async getUserByEmail(email: string) {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user || !user.email) return user;

            this.logger.log('debug', JSON.stringify({
                message: '✅ Пользователь найден по email',
                context: 'UsersService.getUserByEmail',
                email: email,
                userId: user.id
            }));
            return user;
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

    async getProfileData(id: number) {
        try {
            const user = await this.userRepository.findByPk(id, { attributes: { exclude: ['password'] } });
            if (!user) return null;
            this.logger.log('info', JSON.stringify({
                message: '✅ Пользователь найден',
                context: 'UsersService.getProfileData',
                userId: id,
                role: user.role,
                hasArtistProfile: !!user.artistProfile
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

    async getDeletedUsers() {
        const users = await this.userRepository.findAll({
            where: { is_deleted: true }
        });
        return users;
    }
}