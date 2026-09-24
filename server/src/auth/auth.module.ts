import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RefreshToken } from './models/refresh-token.model';
import { User } from '../users/users.model';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ConfigModule } from '@nestjs/config';
import { PasswordModule } from '../password/password.module';
import { PasswordResetCode } from './models/password-reset-code.model';
import { MailModule } from 'src/mail/mail.module';
import { EmailChangeCode } from './models/email-change-code.model';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtRefreshStrategy, JwtAccessStrategy, RolesGuard],
  imports: [UsersModule, ConfigModule,
    SequelizeModule.forFeature([User, RefreshToken, PasswordResetCode, EmailChangeCode]),
    PassportModule,
    PasswordModule,
    JwtModule.register({}),
    MailModule
  ],
  exports: [AuthService, RolesGuard]
})
export class AuthModule { }
