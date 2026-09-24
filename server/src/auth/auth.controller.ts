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
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from './decorators/roles.decorator';
import { RequestCodeDto, VerifyCodeDto } from './dto/request-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import {
    VerifyCurrentEmailDto,
    RequestEmailChangeCodeDto,
    ConfirmEmailChangeDto,
    VerifyPasswordDto,
} from './dto/email-change.dto';
import { ConfirmDeleteAccountDto } from './dto/delete-account.dto';

@ApiTags("Авторизация")
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post("/login")
    // @UsePipes(ValidationPipe)
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
    @Roles(Role.Admin, Role.User, Role.Author, Role.Moderator)
    getMe(@CurrentUser() user: { id: number; email: string, role: Role }) {
        console.log("-----------------------------------------------------------------------------", user)
        return user;
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    @ApiResponse({ status: 200, description: 'Пароль успешно изменён' })
    @ApiResponse({ status: 401, description: 'Неверный текущий пароль' })
    @ApiResponse({ status: 409, description: 'Новый пароль совпадает с текущим' })
    changePassword(
        @CurrentUser('id') userId: number,
        @Body() dto: ChangePasswordDto,
        @Res({ passthrough: true }) res: Response,
        @Req() req: any,
    ) {
        return this.authService.changePassword(userId, dto, res, req);
    }


    @Post('password-reset/request-code')
    @HttpCode(HttpStatus.OK)
    requestResetCode(@Body() dto: RequestCodeDto) {
        return this.authService.requestResetCode(dto);
    }

    @Post('password-reset/verify-code')
    @HttpCode(HttpStatus.OK)
    verifyResetCode(@Body() dto: VerifyCodeDto) {
        return this.authService.verifyResetCode(dto);
    }

    @Post('password-reset/reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Post('email-change/verify-current')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    verifyCurrentEmail(
        @CurrentUser('id') userId: number,
        @Body() dto: VerifyCurrentEmailDto,
    ) {
        return this.authService.verifyCurrentEmail(userId, dto);
    }

    @Post('email-change/request-code')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    requestEmailChangeCode(
        @CurrentUser('id') userId: number,
        @Body() dto: RequestEmailChangeCodeDto,
    ) {
        return this.authService.requestEmailChangeCode(userId, dto);
    }

    @Post('email-change/confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    confirmEmailChange(
        @CurrentUser('id') userId: number,
        @Body() dto: ConfirmEmailChangeDto,
    ) {
        return this.authService.confirmEmailChange(userId, dto);
    }

    @Post('verify-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    verifyPassword(
        @CurrentUser('id') userId: number,
        @Body() dto: VerifyPasswordDto,
    ) {
        return this.authService.verifyPassword(userId, dto);
    }

    @Post('account/delete/request-code')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    requestAccountDeletionCode(@CurrentUser('id') userId: number) {
        return this.authService.requestAccountDeletionCode(userId);
    }

    @Post('account/delete/verify-code')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAccessGuard, RolesGuard)
    verifyAccountDeletionCode(
        @CurrentUser('id') userId: number,
        @Body() dto: ConfirmDeleteAccountDto,
    ) {
        return this.authService.verifyAccountDeletionCode(userId, dto);
    }
}
