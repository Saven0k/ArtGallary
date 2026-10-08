import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SiteVisitService } from './site-visit.service';
import { SiteRatingService } from './site-rating.service';
import { RateSiteDto, TrackVisitDto } from './dto/site.dto';

@ApiTags('Site')
@Controller('site')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SiteController {
  constructor(
    private readonly visitService: SiteVisitService,
    private readonly ratingService: SiteRatingService,
  ) {}

  @Post('visit')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Зафиксировать посещение' })
  async track(
    @Req() req: Request & { user?: { id: number } },
    @Body() dto: TrackVisitDto,
  ) {
    const userId = req.user?.id ?? null;
    const ip = req.ip || null;
    const ua = req.headers['user-agent'] ?? null;
    await this.visitService.track(userId, ip, ua, dto.path ?? '/');
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Статистика сайта (только для админа)' })
  getStats() {
    return this.visitService.getStats();
  }

  @Post('rating')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Поставить/обновить оценку сайта' })
  rate(@CurrentUser('id') userId: number, @Body() dto: RateSiteDto) {
    return this.ratingService.rate(userId, dto.value);
  }

  @Get('rating/me')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Моя оценка сайта' })
  getMyRating(@CurrentUser('id') userId: number) {
    return this.ratingService.getMyRating(userId);
  }
}
