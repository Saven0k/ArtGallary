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

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtRefreshStrategy, JwtAccessStrategy, RolesGuard],
  imports: [UsersModule, ConfigModule,
    SequelizeModule.forFeature([User, RefreshToken]),
    PassportModule,
    PasswordModule,
    JwtModule.register({}),
  ],
  exports: [AuthService, RolesGuard]
})
export class AuthModule { }
