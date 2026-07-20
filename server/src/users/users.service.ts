// src/users/users.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './users.model';
import { CreateUserDto } from './dto/create-user.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { PasswordService } from '../password/password.service';
import { ArtistProfile } from '../artists/artist.model';
import { LocationService } from '../location/location.service';
import { Country } from '../location/models/country.model';
import { City } from '../location/models/city.model';
import { UpdateuserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        private fileService: FilesService,
        private passwordService: PasswordService,
        private locationService: LocationService,
    ) {}

    async onModuleInit() {
        await this.createAdminIfNotExists();
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────

    async createUser(dto: CreateUserDto, image?: any) {
        if (await this.getUserByEmail(dto.email)) {
            throw new HttpException('Пользователь с такой почтой уже существует', 400);
        }

        // ✅ Валидация по числовому ID (не ISO2)
        if (dto.country_id) {
            const country = await this.locationService.getCountryById(dto.country_id);
            if (!country) throw new HttpException('Страна не найдена', HttpStatus.BAD_REQUEST);
        }
        if (dto.city_id) {
            const city = await this.locationService.getCityById(dto.city_id);
            if (!city) throw new HttpException('Город не найден', HttpStatus.BAD_REQUEST);
        }

        const filename = image ? await this.fileService.createFile(image) : '';

        const user = await this.userRepository.create({
            email: dto.email,
            password: await this.passwordService.hashPassword(dto.password),
            name: dto.name,
            surname: dto.surname,
            second_name: dto.second_name || '',
            phone_number: dto.phone_number,
            gender: dto.gender as 'M' | 'F',
            avatar_path: filename,
            role: 'user',
            // ✅ Числовые ID
            city_id: dto.city_id ?? null,
            country_id: dto.country_id ?? null,
        });

        this.logger.log('info', JSON.stringify({
            message: '✅ Пользователь создан',
            context: 'UsersService.createUser',
            userId: user.id,
        }));
        return user;
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    async updateUser(id: number, dto: UpdateuserDto, image?: any) {
        const user = await this.userRepository.findByPk(id);
        if (!user) throw new HttpException('Пользователь не найден', 404);

        // ✅ Валидация по числовому ID
        if (dto.country_id) {
            const country = await this.locationService.getCountryById(dto.country_id);
            if (!country) throw new HttpException('Страна не найдена', HttpStatus.BAD_REQUEST);
        }
        if (dto.city_id) {
            const city = await this.locationService.getCityById(dto.city_id);
            if (!city) throw new HttpException('Город не найден', HttpStatus.BAD_REQUEST);
        }

        let filename = user.avatar_path;
        if (image) {
            if (user.avatar_path) await this.fileService.removeFile(user.avatar_path);
            filename = await this.fileService.createFile(image);
        }

        const updateData: any = {};
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.password) updateData.password = await this.passwordService.hashPassword(dto.password);
        if (dto.name) updateData.name = dto.name;
        if (dto.surname) updateData.surname = dto.surname;
        if (dto.second_name !== undefined) updateData.second_name = dto.second_name;
        if (dto.phone_number) updateData.phone_number = dto.phone_number;
        if (dto.gender) updateData.gender = dto.gender;
        // ✅ Разрешаем обнулять (null = убрать локацию)
        if (dto.city_id !== undefined) updateData.city_id = dto.city_id ?? null;
        if (dto.country_id !== undefined) updateData.country_id = dto.country_id ?? null;
        if (filename) updateData.avatar_path = filename;

        await this.userRepository.update(updateData, { where: { id } });
        return this.getUserById(id);
    }

    // ─── READ ────────────────────────────────────────────────────────────────

    async getAllUsers() {
        return this.userRepository.findAll({
            where: { is_deleted: false },
            // ✅ Локация через JOIN — никаких доп. запросов
            include: [
                { model: Country, as: 'country', attributes: ['id', 'iso2', 'name_ru', 'name_en'], required: false },
                { model: City, as: 'city', attributes: ['id', 'name_ru', 'name_en', 'country_code'], required: false },
            ],
        });
    }

    async getUserById(id: number, includeDeleted: boolean = false) {
        const where: any = { id };
        if (!includeDeleted) where.is_deleted = false;

        return this.userRepository.findOne({
            where,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: ArtistProfile,
                    as: 'artistProfile',
                    attributes: ['user_id', 'date_birthday', 'biography', 'moderate',
                        'profession', 'plan', 'planExpiresAt', 'playStatus',
                        'city_id', 'country_id', 'likes', 'views', 'is_deleted', 'deleted_at'],
                },
                // ✅ Локация через JOIN
                { model: Country, as: 'country', attributes: ['id', 'iso2', 'name_ru', 'name_en'], required: false },
                { model: City, as: 'city', attributes: ['id', 'name_ru', 'name_en', 'country_code'], required: false },
            ],
        });
    }

    async getProfileData(id: number) {
        return this.userRepository.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Country, as: 'country', attributes: ['id', 'iso2', 'name_ru', 'name_en'], required: false },
                { model: City, as: 'city', attributes: ['id', 'name_ru', 'name_en', 'country_code'], required: false },
            ],
        });
    }

    // ─── DELETE / RESTORE ────────────────────────────────────────────────────

    async deleteUserById(id: number): Promise<boolean> {
        const user = await this.userRepository.findByPk(id);
        if (!user) return false;
        if (user.is_deleted) throw new HttpException('Пользователь уже удален', 400);

        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        await user.update({ is_deleted: true, deleted_at: new Date() });
        if (artistProfile) await artistProfile.update({ is_deleted: true, deleted_at: new Date() });
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
                await this.permanentDeleteUser(id);
                throw new HttpException('Срок восстановления истек (более года)', 410);
            }
        }

        await user.update({ is_deleted: false, deleted_at: null });
        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        if (artistProfile) await artistProfile.update({ is_deleted: false, deleted_at: null });
        return user;
    }

    async permanentDeleteUser(id: number): Promise<boolean> {
        const user = await this.userRepository.findByPk(id);
        if (!user) return false;
        if (user.avatar_path) await this.fileService.removeFile(user.avatar_path);
        const artistProfile = await this.artistProfileModel.findOne({ where: { user_id: id } });
        if (artistProfile) await artistProfile.destroy({ force: true });
        await user.destroy({ force: true });
        return true;
    }

    async getDeletedUsers() {
        return this.userRepository.findAll({ where: { is_deleted: true } });
    }

    async getUserByEmail(email: string) {
        try {
            return await this.userRepository.findOne({ where: { email } });
        } catch (e: any) {
            this.logger.log('error', JSON.stringify({ message: '❌ getUserByEmail', error: e }));
            return null;
        }
    }

    // ─── PRIVATE ─────────────────────────────────────────────────────────────

    private async createAdminIfNotExists() {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@mail.ru';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

        try {
            const exists = await this.userRepository.findOne({ where: { email: adminEmail } });
            if (!exists) {
                const admin = await this.userRepository.create({
                    email: adminEmail,
                    password: await this.passwordService.hashPassword(adminPassword),
                    name: process.env.ADMIN_NAME || 'Администратор',
                    surname: process.env.ADMIN_SURNAME || 'Системный',
                    second_name: process.env.ADMIN_SECOND_NAME || 'Системович',
                    phone_number: process.env.ADMIN_PHONE || '+70000000000',
                    role: 'admin',
                    gender: 'M',
                    avatar_path: '',
                });
                this.logger.log('info', `✅ Администратор создан: ${admin.email}`);
            }
        } catch (error: any) {
            this.logger.log('error', `❌ createAdminIfNotExists: ${error.message}`);
        }
    }
}