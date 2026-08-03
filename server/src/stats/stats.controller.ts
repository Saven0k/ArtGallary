import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { StatsFilterDto } from './dto/stats.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
// src/stats/stats.controller.ts
@ApiTags('stats')
@Controller('stats')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
export class StatsController {
    constructor(private statsService: StatsService) {}

    @Get('author/:id')
    @Roles(Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Получить сложную статистику по автору' })
    async getAuthorStats(
        @Param('id') id: number,
        @Query() filter: StatsFilterDto,
        @CurrentUser() user: any,
    ) {
        if (user.role !== Role.Admin && user.id !== id) {
            throw new ForbiddenException('Доступ запрещен');
        }
        return this.statsService.getAuthorDetailedStats(id, filter);
    }

    @Get('art/:id')
    @Roles(Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Получить сложную статистику по картине' })
    async getArtStats(
        @Param('id') id: number,
        @Query() filter: StatsFilterDto,
        @CurrentUser() user: any,
    ) {
        const art = await this.statsService.getArt(id);
        if (user.role !== Role.Admin && art?.author_id !== user.id) {
            throw new ForbiddenException('Доступ запрещен');
        }
        return this.statsService.getArtDetailedStats(id, filter);
    }
}