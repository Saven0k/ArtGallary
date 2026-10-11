import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@ApiBearerAuth()
@Controller('telegram')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.Admin, Role.Moderator)
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Get('status')
  status(@CurrentUser('id') userId: number) {
    return this.telegram.status(userId);
  }

  @Post('link')
  link(@CurrentUser('id') userId: number) {
    return this.telegram.createLink(userId);
  }

  @Delete('link')
  unlink(@CurrentUser('id') userId: number) {
    return this.telegram.unlink(userId);
  }
}
