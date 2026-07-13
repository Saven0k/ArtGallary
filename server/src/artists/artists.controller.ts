import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { ArtistProfile } from './artist.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { ModerateArtistDto } from './dto/modarate-artist.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { PurchaseSubscriptionDto, SubscriptionResponseDto } from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('artists')
export class ArtistsController {
    constructor(private artistService: ArtistsService, private subscriptionService: SubscriptionService) { }

    @ApiOperation({ summary: 'Получение немодерированных артистов' })
    @Roles(Role.Admin, Role.Moderator)
    @Get('unmoderated')
    async getUnmoderatedArtists(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.artistService.getUnmoderatedArtists(parseInt(page), parseInt(limit));
    }

    @ApiOperation({ summary: 'Получение модерированных артистов' })
    @Roles(Role.Admin, Role.Moderator)
    @Get('moderated')
    async getModeratedArtists(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.artistService.getModeratedArtists(parseInt(page), parseInt(limit));
    }

    @ApiOperation({ summary: 'Получения списка артистов (с пагинацией)' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get()
    getArtists(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.artistService.getAll(parseInt(page), parseInt(limit));
    }

    @ApiOperation({ summary: 'Получение артиста по Id' })
    @ApiResponse({ status: 200, type: ArtistProfile })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get(':id')
    getArtist(
        @Param('id') id: number
    ) {
        return this.artistService.getArtistById(id);
    }

    @ApiOperation({ summary: 'Получить все работы артиста' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.User, Role.Visitor)
    @Get(':id/arts')
    getArtsByArtist(
        @Param('id') id: number
    ) {
        return this.artistService.getArtsByArtist(id);
    }

    @ApiOperation({ summary: 'Создание нового артиста' })
    @ApiResponse({ status: 201, type: ArtistProfile })
    @ApiConsumes('multipart/form-data')
    @Roles(Role.Admin, Role.Moderator)
    @Post()
    @UseInterceptors(FileInterceptor('avatar_path'))
    createArtist(@Body() dto: CreateArtistDto, @UploadedFile() image: any) {
        return this.artistService.createArtist(dto, image);
    }

    @ApiOperation({ summary: 'Обновление артиста' })
    @ApiResponse({ status: 200, type: ArtistProfile })
    @ApiConsumes('multipart/form-data')
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('avatar_path'))
    updateArtist(
        @Param('id') id: number,
        @Body() dto: UpdateArtistDto,
        @UploadedFile() image: any
    ) {
        return this.artistService.updateArtist(id, dto, image);
    }

    @ApiOperation({ summary: 'Удаление артиста' })
    @ApiResponse({ status: 200 })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete(':id')
    deleteArtist(@Param('id') id: number) {
        return this.artistService.deleteArtist(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @Roles(Role.Admin, Role.Moderator)
    @Post(':id/moderate')
    moderateArtist(@Body() moderateDto: ModerateArtistDto, @Param('id') id: number) {
        return this.artistService.moderateArtist(moderateDto, id);
    }

    @ApiOperation({ summary: 'Получение информации о подписке текущего пользователя' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Get('subscription/info')
    async getSubscriptionInfo(@Request() req: any): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.getSubscriptionInfo(req.user.id);
    }

    @ApiOperation({ summary: 'Покупка подписки' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post('subscription/purchase')
    async purchaseSubscription(
        @Request() req: any,
        @Body() dto: PurchaseSubscriptionDto
    ): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.purchaseSubscription(req.user.id, dto);
    }

    @ApiOperation({ summary: 'Отмена подписки' })
    @ApiResponse({ status: 200 })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete('subscription/cancel')
    async cancelSubscription(@Request() req: any): Promise<{ success: boolean; message: string }> {
        return this.subscriptionService.cancelSubscription(req.user.id);
    }

    @ApiOperation({ summary: 'Получение доступных планов подписки' })
    @ApiResponse({ status: 200 })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('subscription/plans')
    async getAvailablePlans() {
        return this.subscriptionService.getAvailablePlans();
    }

    @ApiOperation({ summary: 'Получение топ-10 артистов по рейтингу' })
    @ApiResponse({ status: 200, type: [ArtistProfile] })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('top')
    async getTopArtists(
        @Query('limit') limit: string = '10'
    ) {
        return this.artistService.getTopArtists(parseInt(limit));
    }

    @ApiOperation({ summary: 'Восстановление артиста' })
    @Roles(Role.Admin, Role.Moderator)
    @Post(':id/restore')
    async restoreArtist(@Param('id') id: number) {
        return this.artistService.restoreArtist(id);
    }
}