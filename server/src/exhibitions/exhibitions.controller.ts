import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ExhibitionsService } from './exhibitions.service';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ModerateExhibitionDto } from './dto/moderate-exhibition.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from 'src/translation/language.decorator';

@ApiTags('Выставки')
@Controller('exhibitions')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ExhibitionsController {

    constructor(private exhibitionsService: ExhibitionsService) { }

    // ============ СТАТИЧЕСКИЕ GET РОУТЫ (конкретные пути) ============

    @ApiOperation({ summary: 'Получение списка выставок с пагинацией' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get()
    getAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Language() lang: string
    ) {
        return this.exhibitionsService.getAll(page, limit, lang);
    }

    @ApiOperation({ summary: 'Получение модерированных выставок' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('moderated')
    async getModeratedExhibitions(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12',
        @Language() lang: string
    ) {
        return this.exhibitionsService.getModeratedExhibitions(parseInt(page), parseInt(limit), lang);
    }

    @ApiOperation({ summary: 'Получение немодерированных выставок' })
    @Roles(Role.Admin, Role.Moderator)
    @Get('unmoderated')
    async getUnmoderatedExhibitions(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12',
        @Language() lang: string
    ) {
        return this.exhibitionsService.getUnmoderatedExhibitions(parseInt(page), parseInt(limit), lang);
    }

    @ApiOperation({ summary: 'Получить выставки, на которые зарегистрирован пользователь' })
    @Get('user/registered')
    async getUserRegisteredExhibitions(
        @CurrentUser('id') userId: number,
        @Language() lang: string
    ) {
        return this.exhibitionsService.getUserRegisteredExhibitions(userId, lang);
    }

    // ============ ДИНАМИЧЕСКИЕ GET РОУТЫ (с параметрами) ============

    @ApiOperation({ summary: 'Получение выставки по ID' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get(':id')
    getExhibition(
        @Param('id') id: number,
        @Language() lang: string
    ) {
        return this.exhibitionsService.findOne(id, lang);
    }

    @ApiOperation({ summary: 'Получение количества зарегистрированных на выставку' })
    @ApiResponse({ status: 200, type: Number })
    @Get(':id/registered-count')
    async getRegisteredCount(
        @Param('id') exhibitionId: number
    ) {
        return this.exhibitionsService.getRegisteredUsersCount(exhibitionId);
    }

    @ApiOperation({ summary: 'Проверка регистрации пользователя на выставку' })
    @ApiResponse({ status: 200, type: Boolean })
    @Get(':id/check-registration')
    async checkRegistration(
        @Param('id') exhibitionId: number,
        @CurrentUser('id') userId: number
    ) {
        return this.exhibitionsService.isUserRegisteredToExhibition(exhibitionId, userId);
    }

    @ApiOperation({ summary: 'Проверка статуса регистрации пользователя на выставку' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get(':exhibitionId/signup/:userId/status')
    async checkSignUpStatus(
        @Param('exhibitionId') exhibitionId: number,
        @Param('userId') userId: number
    ) {
        const isSignedUp = await this.exhibitionsService.checkSignUpStatus(exhibitionId, userId);
        return { isSignedUp };
    }

    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor)
    @Get('owner/:ownerId')
    async getByOwnerId(
        @Param('ownerId') ownerId: string,
        @Language() lang: string
    ) {
        return this.exhibitionsService.getByOwnerId(+ownerId, lang);
    }

    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor)
    @Get('participant/:artistId')
    async getByParticipantArtistId(
        @Param('artistId') artistId: string,
        @Language() lang: string
    ) {
        return this.exhibitionsService.getByParticipantArtistId(+artistId, lang);
    }

    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor)
    @Get('artist/:artistId/all')
    async getAllArtistExhibitions(
        @Param('artistId') artistId: string,
        @Language() lang: string
    ) {
        return this.exhibitionsService.getAllArtistExhibitions(+artistId, lang);
    }

    // ============ POST РОУТЫ ============

    @ApiOperation({ summary: 'Создание выставки' })
    @UsePipes(ValidationPipe)
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post()
    @UseInterceptors(FileInterceptor('image_path'))
    create(
        @Body() exhibitionDto: CreateExhibitionDto,
        @UploadedFile() image: any
    ) {
        return this.exhibitionsService.create(exhibitionDto, image);
    }

    @ApiOperation({ summary: 'Добавление картины на выставку' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'artId', type: Number, description: 'ID картины' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post(':exhibitionId/art/:artId')
    addArt(
        @Param('exhibitionId') exhibitionId: number,
        @Param('artId') artId: number
    ) {
        return this.exhibitionsService.addArt(exhibitionId, artId);
    }

    @ApiOperation({ summary: 'Добавление художника на выставку' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'artistId', type: Number, description: 'ID художника' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post(':exhibitionId/artist/:artistId')
    addArtist(
        @Param('exhibitionId') exhibitionId: number,
        @Param('artistId') artistId: number
    ) {
        return this.exhibitionsService.addArtist(exhibitionId, artistId);
    }

    @ApiOperation({ summary: 'Запись пользователя на выставку' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor)
    @Post(':exhibitionId/signup/:userId')
    signUp(
        @Param('exhibitionId') exhibitionId: number,
        @Param('userId') userId: number
    ) {
        return this.exhibitionsService.signUp(exhibitionId, userId);
    }

    @ApiOperation({ summary: 'Модерация выставки' })
    @Roles(Role.Admin, Role.Moderator)
    @Post(':id/moderate')
    async moderateExhibition(
        @Body() moderateDto: ModerateExhibitionDto,
        @Param('id') id: string
    ) {
        return this.exhibitionsService.moderate(moderateDto, parseInt(id));
    }

    // ============ PATCH РОУТЫ ============

    @ApiOperation({ summary: 'Обновление выставки по ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID выставки' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('image_path'))
    updateExhibition(
        @Param('id') id: number,
        @CurrentUser('id') userId: number,
        @Body() dto: UpdateExhibitionDto,
        @UploadedFile() image: any,
    ) {
        return this.exhibitionsService.update(id, dto, image, userId);
    }

    // ============ DELETE РОУТЫ ============

    @ApiOperation({ summary: 'Удаление выставки по ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID выставки' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete(':id')
    deleteExhibition(@Param('id') id: number) {
        return this.exhibitionsService.remove(id);
    }

    @ApiOperation({ summary: 'Удаление картины с выставки' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'artId', type: Number, description: 'ID картины' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete(':exhibitionId/art/:artId')
    deleteArt(
        @Param('exhibitionId') exhibitionId: number,
        @Param('artId') artId: number
    ) {
        return this.exhibitionsService.deleteArt(exhibitionId, artId);
    }

    @ApiOperation({ summary: 'Удаление художника с выставки' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'artistId', type: Number, description: 'ID художника' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete(':exhibitionId/artist/:artistId')
    deleteArtist(
        @Param('exhibitionId') exhibitionId: number,
        @Param('artistId') artistId: number
    ) {
        return this.exhibitionsService.deleteArtist(exhibitionId, artistId);
    }

    @ApiOperation({ summary: 'Отмена записи пользователя на выставку' })
    @ApiParam({ name: 'exhibitionId', type: Number, description: 'ID выставки' })
    @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor)
    @Delete(':exhibitionId/signup/:userId')
    cancelSignUp(
        @Param('exhibitionId') exhibitionId: number,
        @Param('userId') userId: number
    ) {
        return this.exhibitionsService.cancelSignUp(exhibitionId, userId);
    }
}