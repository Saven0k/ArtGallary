import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { CreateArtDto } from './dto/create-art.dto';
import { ArtsService } from './arts.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateArtDTO } from './dto/update-art.dto';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModerateArtDto } from './dto/moderate-art.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';

@ApiTags("Arts")
@ApiBearerAuth()
@Controller('arts')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ArtsController {
    constructor(private artsService: ArtsService) { }

    @ApiOperation({ summary: 'Получение топ-10 картин для главной' })
    @Get('top')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getTopArts(@Query('limit') limit?: number) {
        return this.artsService.getTopArts(limit || 10);
    }

    @ApiOperation({ summary: 'Получение списка модерированных картин (сортировка по скору)' })
    @Get('moderated')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getModeratedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.artsService.getModeratedArts(page || 1, limit || 10);
    }

    @ApiOperation({ summary: 'Получение списка немодерированных объектов' })
    @Get('unmoderated')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    getUnmoderatedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.artsService.getUnmoderatedArts(page || 1, limit || 10);
    }

    @ApiOperation({ summary: 'Получения списка всех объектов (админ)' })
    @Get()
    @Roles(Role.Admin, Role.Moderator)
    getAllArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.artsService.getAllArts(page || 1, limit || 10);
    }

    @ApiOperation({ summary: 'Получение объекта по Id' })
    @Get("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getArt(@Param("id") id: number) {
        return this.artsService.getArtById(id);
    }

    @ApiOperation({ summary: 'Добавление картины в топ' })
    @Post(':id/featured')
    @Roles(Role.Admin, Role.Moderator)
    addToFeatured(
        @Param('id') id: number,
        @Query('days') days?: number
    ) {
        return this.artsService.addToFeatured(id, days || 7);
    }

    @ApiOperation({ summary: 'Удаление картины из топа' })
    @Delete(':id/featured')
    @Roles(Role.Admin, Role.Moderator)
    removeFromFeatured(@Param('id') id: number) {
        return this.artsService.removeFromFeatured(id);
    }

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
        @CurrentUser() user: any
    ) {
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== dto.author_id) {
            throw new ForbiddenException('Вы можете создавать работы только от своего имени');
        }
        return this.artsService.createArt(dto, image, dto.author_id);
    }

    @ApiOperation({ summary: 'Обновление объекта' })
    @Patch("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    async updateArt(
        @Param("id") id: number,
        @Body() dto: UpdateArtDTO,
        @CurrentUser() user: any
    ) {
        const art = await this.artsService.getArtById(id);
        if (!art) {
            throw new ForbiddenException('Картина не найдена');
        }
        if (user.role !== Role.Admin && user.role !== Role.Moderator && art.Author_id !== user.id) {
            throw new ForbiddenException('Вы можете редактировать только свои работы');
        }
        return this.artsService.updateArt(id, dto);
    }

    @ApiOperation({ summary: 'Удаление объекта' })
    @Delete("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    async deleteArt(
        @Param("id") id: number,
        @CurrentUser() user: any
    ) {
        const art = await this.artsService.getArtById(id);
        if (!art) {
            throw new ForbiddenException('Картина не найдена');
        }
        if (user.role !== Role.Admin && user.role !== Role.Moderator && art.Author_id !== user.id) {
            throw new ForbiddenException('Вы можете удалять только свои работы');
        }
        return this.artsService.deleteArt(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @Post("/:id/moderate")
    @Roles(Role.Admin, Role.Moderator)
    modarateArt(@Body() modarate: ModerateArtDto, @Param("id") id: number) {
        return this.artsService.moderateArt(modarate, id);
    }

    @ApiOperation({ summary: 'Увеличить количество просмотров' })
    @Post(':id/view')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    async incrementView(
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        return this.artsService.incrementView(id, user.id);
    }

    @Post(':id/share')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Увеличить количество поделившихся картиной' })
    async incrementArtShares(@Param('id') artId: number) {
        return this.artsService.incrementArtShares(artId);
    }

    @Get(':id/share/count')
    @ApiOperation({ summary: 'Получить количество поделившихся картиной' })
    async getArtShares(@Param('id') artId: number) {
        return this.artsService.getArtShares(artId);
    }

    @Post(':id/like')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Поставить/убрать лайк картине' })
    async likeArt(
        @Param('id') artId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.artsService.likeArt(user.id, artId, req);
    }

    @Get(':id/likes')
    @ApiOperation({ summary: 'Получить список лайков картины' })
    async getArtLikes(
        @Param('id') artId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.artsService.getArtLikes(artId, page, limit);
    }

    @Get(':id/likes/count')
    @ApiOperation({ summary: 'Получить количество лайков картины' })
    async getArtLikesCount(@Param('id') artId: number) {
        return this.artsService.getArtLikesCount(artId);
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'Записать просмотр картины' })
    async viewArt(
        @Param('id') artId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.artsService.viewArt(user?.id || null, artId, req);
    }

    @Get(':id/views/count')
    @ApiOperation({ summary: 'Получить количество просмотров картины' })
    async getArtViewsCount(@Param('id') artId: number) {
        return this.artsService.getArtViewsCount(artId);
    }
}