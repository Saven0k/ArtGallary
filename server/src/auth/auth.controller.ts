import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, Response, UseGuards, UsePipes } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ValidationPipe } from '../pipes/validation.pipe';
import { AuthUserDto } from '../users/dto/auth-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './enums/role.enum';
import { Request } from 'express';

@ApiTags("Авторизация")
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post("/login")
    login(@Body() userDto: AuthUserDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(userDto, req, res)
    }

    @Post("/register")
    @UsePipes(ValidationPipe)
    register(@Body() userDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.register(userDto, res)
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshGuard)
    refresh(
        @CurrentUser() payload: JwtRefreshPayload & { rawToken: string },
        @Res({ passthrough: true }) res: Response,
        @Req() req: any,
    ) {
        return this.authService.refresh(payload, res, req);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    logout(
        @CurrentUser('id') userId: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.logout(userId, res);
    }

    @Get('me')
    @UseGuards(JwtAccessGuard, RolesGuard)
    getMe(@CurrentUser() user: { id: number; email: string, role: Role }) {
        return user;
    }

    @Get('debug')
    debug(@Req() req: any) {
        return req.cookies;
    }
}
