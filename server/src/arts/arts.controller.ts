// src/arts/arts.controller.ts
import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { ArtsService } from './arts.service';
import { CreateArtDto } from './dto/create-art.dto';
import { UpdateArtDTO } from './dto/update-art.dto';
import { ModerateArtDto } from './dto/moderate-art.dto';

import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('Arts')
@ApiBearerAuth()
@Controller('arts')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ArtsController {
    constructor(private readonly artsService: ArtsService) {}

    // ============================================================
    // 1. СТАТИЧЕСКИЕ GET-РОУТЫ (должны идти ДО /:id)
    // ============================================================

    @ApiOperation({ summary: 'Получение топ-10 картин для главной' })
    @Get('top')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getTopArts(@Query('limit') limit?: number) {
        return this.artsService.getTopArts(Number(limit) || 10);
    }

    @ApiOperation({
        summary: 'Получение списка модерированных картин (сортировка по скору)',
    })
    @Get('moderated')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getModeratedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.artsService.getModeratedArts(
            Number(page) || 1,
            Number(limit) || 10,
        );
    }

    @ApiOperation({ summary: 'Получение списка немодерированных объектов' })
    @Get('unmoderated')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    getUnmoderatedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.artsService.getUnmoderatedArts(
            Number(page) || 1,
            Number(limit) || 10,
        );
    }

    // ⚠️ ВАЖНО: 'liked' тоже статический путь, он ДОЛЖЕН быть до /:id
    @Get('liked')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({
        summary: 'Получить картины, которые лайкнул текущий пользователь',
    })
    @ApiResponse({ status: 200, description: 'Список понравившихся картин' })
    async getLikedArts(
        @CurrentUser('id') userId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 12,
        @Query('lang') lang: string = 'ru',
    ) {
        return this.artsService.getLikedArts(
            userId,
            Number(page),
            Number(limit),
            lang,
        );
    }

    @ApiOperation({ summary: 'Получения списка всех объектов (админ)' })
    @Get()
    @Roles(Role.Admin, Role.Moderator)
    getAllArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.artsService.getAllArts(
            Number(page) || 1,
            Number(limit) || 10,
        );
    }

    // ============================================================
    // 2. СТАТИЧЕСКИЕ POST-РОУТЫ (тоже ДО /:id)
    // ============================================================

    @ApiOperation({ summary: 'Обновить все скоры' })
    @Post('update-scores')
    @Roles(Role.Admin)
    updateAllScores() {
        return this.artsService.updateAllScores();
    }

    @ApiOperation({ summary: 'Обновить топ' })
    @Post('refresh-featured')
    @Roles(Role.Admin)
    refreshFeatured() {
        return this.artsService.refreshFeaturedArts();
    }

    @ApiOperation({ summary: 'Создание нового объекта' })
    @Post()
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    @UseInterceptors(FileInterceptor('image_path'))
    createArt(
        @Body() dto: CreateArtDto,
        @UploadedFile() image: any,
        @CurrentUser() user: any,
    ) {
        if (
            user.role !== Role.Admin &&
            user.role !== Role.Moderator &&
            user.id !== dto.author_id
        ) {
            throw new ForbiddenException(
                'Вы можете создавать работы только от своего имени',
            );
        }
        return this.artsService.createArt(dto, image, dto.author_id);
    }

    // ============================================================
    // 3. ПАРАМЕТРИЧЕСКИЕ РОУТЫ (всё, что содержит :id)
    // ============================================================

    @ApiOperation({ summary: 'Получение объекта по Id' })
    @Get(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getArt(@Param('id', ParseIntPipe) id: number) {
        return this.artsService.getArtById(id);
    }

    @ApiOperation({ summary: 'Обновление объекта' })
    @Patch(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    async updateArt(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateArtDTO,
        @CurrentUser() user: any,
    ) {
        const art = await this.artsService.getArtById(id);
        if (!art) throw new ForbiddenException('Картина не найдена');

        if (
            user.role !== Role.Admin &&
            user.role !== Role.Moderator &&
            art.Author_id !== user.id
        ) {
            throw new ForbiddenException(
                'Вы можете редактировать только свои работы',
            );
        }
        return this.artsService.updateArt(id, dto);
    }

    @ApiOperation({ summary: 'Удаление объекта' })
    @Delete(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    async deleteArt(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: any,
    ) {
        const art = await this.artsService.getArtById(id);
        if (!art) throw new ForbiddenException('Картина не найдена');

        if (
            user.role !== Role.Admin &&
            user.role !== Role.Moderator &&
            art.Author_id !== user.id
        ) {
            throw new ForbiddenException(
                'Вы можете удалять только свои работы',
            );
        }
        return this.artsService.deleteArt(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @Post(':id/moderate')
    @Roles(Role.Admin, Role.Moderator)
    moderateArt(
        @Body() moderate: ModerateArtDto,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.artsService.moderateArt(moderate, id);
    }

    // ------------------------------------------------------------
    // 3.1. Featured
    // ------------------------------------------------------------

    @ApiOperation({ summary: 'Добавление картины в топ' })
    @Post(':id/featured')
    @Roles(Role.Admin, Role.Moderator)
    addToFeatured(
        @Param('id', ParseIntPipe) id: number,
        @Query('days') days?: number,
    ) {
        return this.artsService.addToFeatured(id, Number(days) || 7);
    }

    @ApiOperation({ summary: 'Удаление картины из топа' })
    @Delete(':id/featured')
    @Roles(Role.Admin, Role.Moderator)
    removeFromFeatured(@Param('id', ParseIntPipe) id: number) {
        return this.artsService.removeFromFeatured(id);
    }

    // ------------------------------------------------------------
    // 3.2. Views (только один роут на просмотр!)
    // ------------------------------------------------------------

    @ApiOperation({ summary: 'Записать просмотр картины' })
    @Post(':id/view')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    viewArt(
        @Param('id', ParseIntPipe) artId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.artsService.viewArt(user?.id || null, artId, req);
    }

    @Get(':id/views/count')
    @ApiOperation({ summary: 'Получить количество просмотров картины' })
    async getArtViewsCount(@Param('id', ParseIntPipe) artId: number) {
        return this.artsService.getArtViewsCount(artId);
    }

    // ------------------------------------------------------------
    // 3.3. Shares
    // ------------------------------------------------------------

    @Post(':id/share')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Увеличить количество поделившихся картиной' })
    async incrementArtShares(@Param('id', ParseIntPipe) artId: number) {
        return this.artsService.incrementArtShares(artId);
    }

    @Get(':id/share/count')
    @ApiOperation({ summary: 'Получить количество поделившихся картиной' })
    async getArtShares(@Param('id', ParseIntPipe) artId: number) {
        return this.artsService.getArtShares(artId);
    }

    // ------------------------------------------------------------
    // 3.4. Likes
    // ------------------------------------------------------------

    @Post(':id/like')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Поставить/убрать лайк картине' })
    async likeArt(
        @Param('id', ParseIntPipe) artId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.artsService.likeArt(user.id, artId, req);
    }

    @Get(':id/likes')
    @ApiOperation({ summary: 'Получить список лайков картины' })
    async getArtLikes(
        @Param('id', ParseIntPipe) artId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.artsService.getArtLikes(
            artId,
            Number(page) || 1,
            Number(limit) || 20,
        );
    }

    @Get(':id/likes/count')
    @ApiOperation({ summary: 'Получить количество лайков картины' })
    async getArtLikesCount(@Param('id', ParseIntPipe) artId: number) {
        return this.artsService.getArtLikesCount(artId);
    }
}