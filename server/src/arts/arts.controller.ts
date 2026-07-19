import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateArtDto } from './dto/create-art.dto';
import { ArtsService } from './arts.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateArtDTO } from './dto/update-art.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModerateArtDto } from './dto/moderate-art.dto';

@ApiTags("Arts")
@Controller('arts')
export class ArtsController {
    constructor(private artsService: ArtsService) { }


    @ApiOperation({ summary: 'Получение топ-10 картин для главной' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('top')
    getTopArts(
        @Query('limit') limit?: number
    ) {
        return this.artsService.getTopArts(limit || 10);
    }

    @ApiOperation({ summary: 'Получение списка модерированных картин (сортировка по скору)' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('moderated')
    getModeratedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.artsService.getModeratedArts(page || 1, limit || 10);
    }

    @ApiOperation({ summary: 'Получение списка немодерированных объектов' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Get('unmoderated')
    getUnmoderatedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.artsService.getUnmoderatedArts(page || 1, limit || 10);
    }

    @ApiOperation({ summary: 'Получения списка всех объектов (админ)' })
    @Roles(Role.Admin, Role.Moderator)
    @Get()
    getAllArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.artsService.getAllArts(page || 1, limit || 10);
    }
    
    @ApiOperation({ summary: 'Получение объекта по Id' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get("/:id")
    getArt(
        @Param("id") id: number
    ) {
        return this.artsService.getArtById(id);
    }

    @ApiOperation({ summary: 'Добавление картины в топ' })
    @Roles(Role.Admin, Role.Moderator)
    @Post(':id/featured')
    addToFeatured(
        @Param('id') id: number,
        @Query('days') days?: number
    ) {
        return this.artsService.addToFeatured(id, days || 7);
    }

    @ApiOperation({ summary: 'Удаление картины из топа' })
    @Roles(Role.Admin, Role.Moderator)
    @Delete(':id/featured')
    removeFromFeatured(@Param('id') id: number) {
        return this.artsService.removeFromFeatured(id);
    }

    @ApiOperation({ summary: 'Обновить все скоры' })
    @Roles(Role.Admin)
    @Post('update-scores')
    updateAllScores() {
        return this.artsService.updateAllScores();
    }

    @ApiOperation({ summary: 'Обновить топ' })
    @Roles(Role.Admin)
    @Post('refresh-featured')
    refreshFeatured() {
        return this.artsService.refreshFeaturedArts();
    }

    @ApiOperation({ summary: 'Создание нового объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post()
    @UseInterceptors(FileInterceptor('image_path'))
    createArt(@Body() dto: CreateArtDto, @UploadedFile() image: any) {
        return this.artsService.createArt(dto, image, dto.artist_id);
    }

    @ApiOperation({ summary: 'Обновление объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Patch("/:id")
    updateArt(@Param("id") id: number, @Body() dto: UpdateArtDTO) {
        return this.artsService.updateArt(id, dto);
    }

    @ApiOperation({ summary: 'Удаление объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete("/:id")
    deleteArt(@Param("id") id: number) {
        return this.artsService.deleteArt(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @Roles(Role.Admin, Role.Moderator)
    @Post("/:id/moderate")
    modarateArt(@Body() modarate: ModerateArtDto, @Param("id") id: number) {
        return this.artsService.moderateArt(modarate, id);
    }
    @ApiOperation({ summary: 'Увеличить количество просмотров' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Post(':id/view')
    async incrementView(
        @Param('id') id: number,
        @Request() req: any
    ) {
        const userId = req.user?.id;
        return this.artsService.incrementView(id, userId);
    }
}