import {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
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
import {
  RequestCodeDto,
  VerifyCodeDto,
  VerifyAccountCodeDto,
} from './dto/request-code.dto';
import { contentLanguage } from '../translation/translation-text';
import { ResetPasswordDto } from './dto/reset-password.dto';

import {
  VerifyCurrentEmailDto,
  RequestEmailChangeCodeDto,
  ConfirmEmailChangeDto,
  VerifyPasswordDto,
} from './dto/email-change.dto';
import { ConfirmDeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('Авторизация')
@Controller('auth')
@UsePipes(ValidationPipe)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  login(
    @Body() userDto: AuthUserDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.login(userDto, req, res);
  }

  @Post('/register')
  register(
    @Body() userDto: CreateUserDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.register(userDto, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  refresh(
    @CurrentUser() payload: JwtRefreshPayload & { rawToken: string },
    @Res({ passthrough: true }) res: ExpressResponse,
    @Req() req: ExpressRequest,
  ) {
    return this.authService.refresh(payload, res, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, RolesGuard)
  logout(
    @CurrentUser('id') userId: number,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.logout(userId, res);
  }

  @Get('me')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.User, Role.Author, Role.Moderator)
  getMe(@CurrentUser() user: { id: number; email: string; role: Role }) {
    return user;
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Пароль успешно изменён' })
  @ApiResponse({
    status: 401,
    description: 'Код не подтверждён или подтверждение истекло',
  })
  @ApiResponse({ status: 409, description: 'Новый пароль совпадает с текущим' })
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.changePassword(userId, dto, res);
  }

  @Post('password-reset/request-code')
  @HttpCode(HttpStatus.OK)
  requestResetCode(@Body() dto: RequestCodeDto, @Query('lang') lang?: string) {
    return this.authService.requestResetCode(dto, contentLanguage(lang));
  }

  @Post('password-change/request-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  requestPasswordChangeCode(
    @CurrentUser('id') userId: number,
    @Query('lang') lang?: string,
  ) {
    return this.authService.requestPasswordChangeCode(
      userId,
      contentLanguage(lang),
    );
  }

  @Post('password-change/verify-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  verifyPasswordChangeCode(
    @CurrentUser('id') userId: number,
    @Body() dto: VerifyAccountCodeDto,
  ) {
    return this.authService.verifyPasswordChangeCode(userId, dto);
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
    @Query('lang') lang?: string,
  ) {
    return this.authService.requestEmailChangeCode(
      userId,
      dto,
      contentLanguage(lang),
    );
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
  requestAccountDeletionCode(
    @CurrentUser('id') userId: number,
    @Query('lang') lang?: string,
  ) {
    return this.authService.requestAccountDeletionCode(
      userId,
      contentLanguage(lang),
    );
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
