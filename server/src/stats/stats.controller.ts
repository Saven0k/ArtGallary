// src/stats/stats.controller.ts
import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { StatsFilterDto } from './dto/stats.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('stats')
@Controller('stats')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    // -------------------- AUTHOR --------------------

    @Get('author/:id')
    @Roles(Role.Author, Role.Admin)
    @ApiOperation({
        summary: 'Полная статистика по автору',
        description:
            'totalLikes — лайки всех картин автора, ' +
            'totalViews — просмотры всех картин автора + просмотры профиля автора.',
    })
    @ApiOkResponse({ description: 'AuthorStatsResponse' })
    async getAuthorStats(
        @Param('id', ParseIntPipe) id: number,
        @Query() filter: StatsFilterDto,
        @CurrentUser() user: any,
    ) {
        if (user.role !== Role.Admin && Number(user.id) !== id) {
            throw new ForbiddenException('Доступ запрещен');
        }
        return this.statsService.getAuthorStats(id, filter);
    }

    // -------------------- ART --------------------

    @Get('art/:id')
    @Roles(Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Полная статистика по картине' })
    @ApiOkResponse({ description: 'ArtStatsResponse' })
    async getArtStats(
        @Param('id', ParseIntPipe) id: number,
        @Query() filter: StatsFilterDto,
        @CurrentUser() user: any,
    ) {
        const art = await this.statsService.getArt(id);
        if (!art) {
            throw new ForbiddenException('Доступ запрещен');
        }
        if (user.role !== Role.Admin && Number(art.author_id) !== Number(user.id)) {
            throw new ForbiddenException('Доступ запрещен');
        }
        return this.statsService.getArtStats(id, filter);
    }
}