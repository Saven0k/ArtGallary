import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {

    private readonly SALT_ROUNDS = 10;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) { }

    async hashPassword(password: string) {
        this.logger.log('debug', JSON.stringify({
            message: '🔐 Хэширование пароля',
            context: 'PasswordService.hashPassword',
            saltRounds: this.SALT_ROUNDS
        }));

        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async comparePassword(password: string, hashPassword: string) {
        this.logger.log('debug', JSON.stringify({
            message: '🔐 Сравнение паролей',
            context: 'PasswordService.comparePassword'
        }));

        try {
            const result = await bcrypt.compare(password, hashPassword);

            this.logger.log('debug', JSON.stringify({
                message: result ? '✅ Пароли совпадают' : '❌ Пароли не совпадают',
                context: 'PasswordService.comparePassword',
                result: result
            }));

            return result;
        } catch (e:any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при сравнении паролей',
                context: 'PasswordService.comparePassword',
                error: e.message,
                stack: e.stack,

            }));
            throw new Error("Ошибка при сравнении пароля");
        }
    }

    validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
        this.logger.log('debug', JSON.stringify({
            message: '🔍 Проверка сложности пароля',
            context: 'PasswordService.validatePasswordStrength',
            passwordLength: password?.length
        }));

        if (!password || password.length < 6) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Пароль слишком короткий',
                context: 'PasswordService.validatePasswordStrength',
                length: password?.length,
                minLength: 6
            }));
            return {
                isValid: false,
                message: 'Пароль должен содержать минимум 6 символов'
            };
        }

        if (password.length > 50) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ Пароль слишком длинный',
                context: 'PasswordService.validatePasswordStrength',
                length: password.length,
                maxLength: 50
            }));
            return {
                isValid: false,
                message: 'Пароль не должен превышать 50 символов'
            };
        }

        if (!/\d/.test(password)) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ В пароле нет цифр',
                context: 'PasswordService.validatePasswordStrength'
            }));
            return {
                isValid: false,
                message: 'Пароль должен содержать хотя бы одну цифру'
            };
        }

        if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ В пароле нет букв в разных регистрах',
                context: 'PasswordService.validatePasswordStrength'
            }));
            return {
                isValid: false,
                message: 'Пароль должен содержать буквы в верхнем и нижнем регистре'
            };
        }

        if (!/[!@#$%^&*]/.test(password)) {
            this.logger.log('warn', JSON.stringify({
                message: '⚠️ В пароле нет специальных символов',
                context: 'PasswordService.validatePasswordStrength'
            }));
            return {
                isValid: false,
                message: 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&*)'
            };
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Пароль прошел проверку сложности',
            context: 'PasswordService.validatePasswordStrength'
        }));

        return { isValid: true };
    }
}