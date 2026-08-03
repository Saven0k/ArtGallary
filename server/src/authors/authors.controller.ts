import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthorProfile } from './author.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { ModerateAuthorDto } from './dto/moderate-author.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from 'src/subscriptions/subscriptions.service';
import { PurchaseSubscriptionDto, SubscriptionResponseDto } from 'src/subscriptions/dto/subscription.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';
import { AuthorFollowService } from './author-follow.service';
import { AuthorsService } from './authors.service';

@ApiTags('Авторы')
@ApiBearerAuth()
@Controller('authors')
@UseGuards(JwtAccessGuard, RolesGuard)
export class AuthorsController {
    constructor(
        private authorService: AuthorsService,
        private subscriptionService: SubscriptionService,
        private followService: AuthorFollowService,
    ) { }

    @ApiOperation({ summary: 'Получение немодерированных авторов' })
    @ApiResponse({ status: 200, description: 'Список немодерированных авторов' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Get('unmoderated')
    @Roles(Role.Admin, Role.Moderator)
    async getUnmoderatedAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.authorService.getUnmoderatedAuthors(parseInt(page), parseInt(limit));
    }

    @ApiOperation({ summary: 'Получение модерированных авторов' })
    @ApiResponse({ status: 200, description: 'Список модерированных авторов' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Get('moderated')
    @Roles(Role.Admin, Role.Moderator)
    async getModeratedAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.authorService.getModeratedAuthors(parseInt(page), parseInt(limit));
    }


    @ApiOperation({ summary: 'Получение списка авторов (с пагинацией)' })
    @ApiResponse({ status: 200, description: 'Список авторов' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User) // 👈 Все роли
    getAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ) {
        return this.authorService.getAll(parseInt(page), parseInt(limit));
    }

    @ApiOperation({ summary: 'Получение автора по Id' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 404, description: 'Автор не найден' })
    @Get(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User) // 👈 Все роли
    getAuthor(@Param('id') id: number) {
        return this.authorService.getAuthorById(id);
    }

    @ApiOperation({ summary: 'Получение своего профиля автора' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Get('me')
    @Roles(Role.Author)
    async getMyAuthorProfile(@CurrentUser() user: any) {
        return this.authorService.getMyAuthorProfile(user.id);
    }

    @ApiOperation({ summary: 'Получить все работы автора' })
    @ApiResponse({ status: 200, description: 'Список работ автора' })
    @Get(':id/arts')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.User, Role.Visitor) // 👈 Все роли
    getArtsByAuthor(@Param('id') id: number) {
        return this.authorService.getArtsByAuthor(id);
    }

    @ApiOperation({ summary: 'Обновление автора' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Можно обновлять только свой профиль' })
    @ApiConsumes('multipart/form-data')
    @Patch(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    @UseInterceptors(FileInterceptor('avatar_path'))
    async updateAuthor(
        @Param('id') id: number,
        @Body() dto: UpdateAuthorDto,
        @UploadedFile() image: any,
        @CurrentUser() user: any
    ) {
        // 👇 Проверяем, что пользователь обновляет свой профиль (если не админ/модератор)
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== id) {
            throw new ForbiddenException('Вы можете редактировать только свой профиль');
        }
        return this.authorService.updateAuthor(id, dto, image);
    }

    @ApiOperation({ summary: 'Удаление автора' })
    @ApiResponse({ status: 200, description: 'Автор удален' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов, модераторов и владельца' })
    @Delete(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    async deleteAuthor(
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== id) {
            throw new ForbiddenException('Вы можете удалить только свой профиль');
        }
        return this.authorService.deleteAuthor(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @ApiResponse({ status: 200, description: 'Статус модерации обновлен' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Post(':id/moderate')
    @Roles(Role.Admin, Role.Moderator)
    moderateAuthor(@Body() moderateDto: ModerateAuthorDto, @Param('id') id: number) {
        return this.authorService.moderateAuthor(moderateDto, id);
    }

    @ApiOperation({ summary: 'Восстановление автора' })
    @ApiResponse({ status: 200, description: 'Автор восстановлен' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Post(':id/restore')
    @Roles(Role.Admin, Role.Moderator)
    async restoreAuthor(@Param('id') id: number) {
        return this.authorService.restoreAuthor(id);
    }

    @ApiOperation({ summary: 'Создание нового автора' })
    @ApiResponse({ status: 201, type: AuthorProfile })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @ApiConsumes('multipart/form-data')
    @Post()
    @UseInterceptors(FileInterceptor('avatar_path'))
    createAuthor(@Body() dto: CreateAuthorDto, @UploadedFile() image: any) {
        return this.authorService.createAuthor(dto, image);
    }

    @ApiOperation({ summary: 'Получение информации о подписке текущего пользователя' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Get('subscription/info')
    @Roles(Role.Author)
    async getSubscriptionInfo(@CurrentUser() user: any): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.getSubscriptionInfo(user.id);
    }

    @ApiOperation({ summary: 'Покупка подписки' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Post('subscription/purchase')
    @Roles(Role.Author)
    async purchaseSubscription(
        @CurrentUser() user: any,
        @Body() dto: PurchaseSubscriptionDto
    ): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.purchaseSubscription(user.id, dto);
    }

    @ApiOperation({ summary: 'Отмена подписки' })
    @ApiResponse({ status: 200, description: 'Подписка отменена' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Delete('subscription/cancel')
    @Roles(Role.Author)
    async cancelSubscription(@CurrentUser() user: any): Promise<{ success: boolean; message: string }> {
        return this.subscriptionService.cancelSubscription(user.id);
    }

    @ApiOperation({ summary: 'Получение доступных планов подписки' })
    @ApiResponse({ status: 200, description: 'Список доступных планов' })
    @Get('subscription/plans')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    async getAvailablePlans() {
        return this.subscriptionService.getAvailablePlans();
    }

    @ApiOperation({ summary: 'Получение топ-10 авторов по рейтингу' })
    @ApiResponse({ status: 200, type: [AuthorProfile] })
    @Get('top')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    async getTopAuthors(@Query('limit') limit: string = '10') {
        return this.authorService.getTopAuthors(parseInt(limit));
    }

    @Get(':id/followers')
    @ApiOperation({ summary: 'Получить подписчиков автора' })
    async getAuthorFollowers(
        @Param('id') authorId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.followService.getAuthorFollowers(authorId, page, limit);
    }


    @Get(':id/followers/count')
    @ApiOperation({ summary: 'Количество подписчиков' })
    async getFollowersCount(@Param('id') authorId: number) {
        return { count: await this.followService.getFollowersCount(authorId) };
    }

    @Post(':id/share')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Увеличить количество поделившихся автором' })
    async incrementAuthorShares(@Param('id') authorId: number) {
        return this.authorService.incrementAuthorShares(authorId);
    }

    @Get(':id/share/count')
    @ApiOperation({ summary: 'Получить количество поделившихся автором' })
    async getAuthorShares(@Param('id') authorId: number) {
        return this.authorService.getAuthorShares(authorId);
    }

    @Post(':id/like')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Поставить/убрать лайк автору' })
    async likeAuthor(
        @Param('id') authorId: number,
        @CurrentUser() user: any,
    ) {
        return this.authorService.likeAuthor(user.id, authorId);
    }

    @Get(':id/likes')
    @ApiOperation({ summary: 'Получить список лайков автора' })
    async getAuthorLikes(
        @Param('id') authorId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.authorService.getAuthorLikes(authorId, page, limit);
    }

    @Get(':id/likes/count')
    @ApiOperation({ summary: 'Получить количество лайков автора' })
    async getAuthorLikesCount(@Param('id') authorId: number) {
        return this.authorService.getAuthorLikesCount(authorId);
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'Записать просмотр автора' })
    async viewAuthor(
        @Param('id') authorId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.authorService.viewAuthor(user?.id || null, authorId, req);
    }

    @Get(':id/views/count')
    @ApiOperation({ summary: 'Получить количество просмотров автора' })
    async getAuthorViewsCount(@Param('id') authorId: number) {
        return this.authorService.getAuthorViewsCount(authorId);
    }
}
