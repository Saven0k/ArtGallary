// src/authors/authors.controller.ts
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
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthorProfile } from './author.model';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { ModerateAuthorDto } from './dto/moderate-author.dto';

import { AuthorsService } from './authors.service';
import { AuthorFollowService } from './author-follow.service';
import { SubscriptionService } from 'src/subscriptions/subscriptions.service';
import {
    PurchaseSubscriptionDto,
    SubscriptionResponseDto,
} from 'src/subscriptions/dto/subscription.dto';

import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Авторы')
@Controller('authors')
export class AuthorsController {
    constructor(
        private readonly authorService: AuthorsService,
        private readonly subscriptionService: SubscriptionService,
        private readonly followService: AuthorFollowService,
    ) { }

    // =====================================================================
    // 1. СТАТИЧЕСКИЕ GET-РОУТЫ (должны идти ДО /:id)
    // =====================================================================

    @ApiOperation({ summary: 'Получение своего профиля автора' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Get('me')
    @UseGuards(JwtAccessGuard, RolesGuard)
    @Roles(Role.Author, Role.Admin, Role.User)
    getMyAuthorProfile(@CurrentUser() user: any) {
        return this.authorService.getMyAuthorProfile(user.id);
    }

    @ApiOperation({ summary: 'Получение немодерированных авторов' })
    @ApiResponse({ status: 200, description: 'Список немодерированных авторов' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Get('unmoderated')
    @Roles(Role.Admin, Role.Moderator)
    getUnmoderatedAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12',
    ) {
        return this.authorService.getUnmoderatedAuthors(
            parseInt(page, 10),
            parseInt(limit, 10),
        );
    }

    @ApiOperation({ summary: 'Получение модерированных авторов' })
    @ApiResponse({ status: 200, description: 'Список модерированных авторов' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Get('moderated')
    @Roles(Role.Admin, Role.Moderator)
    getModeratedAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12',
    ) {
        return this.authorService.getModeratedAuthors(
            parseInt(page, 10),
            parseInt(limit, 10),
        );
    }

    @ApiOperation({ summary: 'Получение топ-10 авторов по рейтингу' })
    @ApiResponse({ status: 200, type: [AuthorProfile] })
    @Get('top')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getTopAuthors(@Query('limit') limit: string = '10') {
        return this.authorService.getTopAuthors(parseInt(limit, 10));
    }

    @ApiOperation({ summary: 'Получение информации о подписке текущего пользователя' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Get('subscription/info')
    @Roles(Role.Author)
    getSubscriptionInfo(
        @CurrentUser() user: any,
    ): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.getSubscriptionInfo(user.id);
    }

    @ApiOperation({ summary: 'Получение доступных планов подписки' })
    @ApiResponse({ status: 200, description: 'Список доступных планов' })
    @Get('subscription/plans')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAvailablePlans() {
        return this.subscriptionService.getAvailablePlans();
    }

    @ApiOperation({ summary: 'Получение списка авторов (с пагинацией)' })
    @ApiResponse({ status: 200, description: 'Список авторов' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAuthors(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12',
    ) {
        return this.authorService.getAll(parseInt(page, 10), parseInt(limit, 10));
    }


    @ApiOperation({ summary: 'Авторы, на которых подписан текущий пользователь' })
    @Get('following')
    @UseGuards(JwtAccessGuard, RolesGuard)
    @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
    getFollowing(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        return this.followService.getUserFollowing(
            user.id,
            parseInt(page, 10),
            parseInt(limit, 10),
        );
    }

    // =====================================================================
    // 2. СТАТИЧЕСКИЕ POST/DELETE-РОУТЫ (тоже ДО /:id)
    // =====================================================================

    @ApiOperation({ summary: 'Создание нового автора' })
    @ApiResponse({ status: 201, type: AuthorProfile })
    @ApiConsumes('multipart/form-data')
    @Post()
    @UseInterceptors(FileInterceptor('avatar_path'))
    createAuthor(@Body() dto: CreateAuthorDto, @UploadedFile() image: any) {
        return this.authorService.createAuthor(dto, image);
    }

    @ApiOperation({ summary: 'Покупка подписки' })
    @ApiResponse({ status: 200, type: SubscriptionResponseDto })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Post('subscription/purchase')
    @Roles(Role.Author)
    purchaseSubscription(
        @CurrentUser() user: any,
        @Body() dto: PurchaseSubscriptionDto,
    ): Promise<SubscriptionResponseDto> {
        return this.subscriptionService.purchaseSubscription(user.id, dto);
    }

    @ApiOperation({ summary: 'Отмена подписки' })
    @ApiResponse({ status: 200, description: 'Подписка отменена' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для авторов' })
    @Delete('subscription/cancel')
    @Roles(Role.Author)
    cancelSubscription(
        @CurrentUser() user: any,
    ): Promise<{ success: boolean; message: string }> {
        return this.subscriptionService.cancelSubscription(user.id);
    }

    // =====================================================================
    // 3. ПАРАМЕТРИЧЕСКИЕ РОУТЫ (всё, что содержит :id) — В САМОМ НИЗУ
    // =====================================================================

    @ApiOperation({ summary: 'Получение автора по Id' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 404, description: 'Автор не найден' })
    @Get(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAuthor(@Param('id', ParseIntPipe) id: number) {
        return this.authorService.getAuthorById(id);
    }

    @ApiOperation({ summary: 'Проверить, подписан ли текущий пользователь на автора' })
    @Get(':id/follow/check')
    @UseGuards(JwtAccessGuard, RolesGuard)
    @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
    checkFollow(
        @Param('id', ParseIntPipe) authorId: number,
        @CurrentUser() user: any,
    ) {
        return this.followService.checkFollow(user.id, authorId);
    }

    @ApiOperation({ summary: 'Подписаться/отписаться от автора' })
    @Post(':id/follow')
    @UseGuards(JwtAccessGuard, RolesGuard)
    @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
    toggleFollow(
        @Param('id', ParseIntPipe) authorId: number,
        @CurrentUser() user: any,
    ) {
        return this.followService.toggleFollow(user.id, authorId);
    }

    @ApiOperation({ summary: 'Получить все работы автора' })
    @ApiResponse({ status: 200, description: 'Список работ автора' })
    @Get(':id/arts')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.User, Role.Visitor)
    getArtsByAuthor(@Param('id', ParseIntPipe) id: number) {
        return this.authorService.getArtsByAuthor(id);
    }

    @ApiOperation({ summary: 'Обновление автора' })
    @ApiResponse({ status: 200, type: AuthorProfile })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Можно обновлять только свой профиль' })
    @ApiConsumes('multipart/form-data')
    @Patch(':id')
    @UseGuards(JwtAccessGuard, RolesGuard)
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    @UseInterceptors(FileInterceptor('avatar_path'))
    updateAuthor(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAuthorDto,
        @UploadedFile() image: any,
        @CurrentUser() user: any,
    ) {
        if (
            user.role !== Role.Admin &&
            user.role !== Role.Moderator &&
            user.id !== id
        ) {
            throw new ForbiddenException('Вы можете редактировать только свой профиль');
        }
        return this.authorService.updateAuthor(id, dto, image);
    }

    @ApiOperation({ summary: 'Удаление автора' })
    @ApiResponse({ status: 200, description: 'Автор удален' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов, модераторов и владельца' })
    @Delete(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    deleteAuthor(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: any,
    ) {
        if (
            user.role !== Role.Admin &&
            user.role !== Role.Moderator &&
            user.id !== id
        ) {
            throw new ForbiddenException('Вы можете удалить только свой профиль');
        }
        return this.authorService.deleteAuthor(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @ApiResponse({ status: 200, description: 'Статус модерации обновлен' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Post(':id/moderate')
    @Roles(Role.Admin, Role.Moderator)
    moderateAuthor(
        @Body() moderateDto: ModerateAuthorDto,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.authorService.moderateAuthor(moderateDto, id);
    }

    @ApiOperation({ summary: 'Восстановление автора' })
    @ApiResponse({ status: 200, description: 'Автор восстановлен' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для админов и модераторов' })
    @Post(':id/restore')
    @Roles(Role.Admin, Role.Moderator)
    restoreAuthor(@Param('id', ParseIntPipe) id: number) {
        return this.authorService.restoreAuthor(id);
    }

    @ApiOperation({ summary: 'Увеличить количество поделившихся автором' })
    @Post(':id/share')
    @Roles(Role.User, Role.Author, Role.Admin)
    incrementAuthorShares(@Param('id', ParseIntPipe) authorId: number) {
        return this.authorService.incrementAuthorShares(authorId);
    }

    @ApiOperation({ summary: 'Записать просмотр автора' })
    @Post(':id/view')
    viewAuthor(
        @Param('id', ParseIntPipe) authorId: number,
        @CurrentUser() user: any,
        @Request() req: any,
    ) {
        return this.authorService.viewAuthor(user?.id || null, authorId, req);
    }

    @ApiOperation({ summary: 'Получить подписчиков автора' })
    @Get(':id/followers')
    getAuthorFollowers(
        @Param('id', ParseIntPipe) authorId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.followService.getAuthorFollowers(authorId, page, limit);
    }

    @ApiOperation({ summary: 'Количество подписчиков' })
    @Get(':id/followers/count')
    getFollowersCount(@Param('id', ParseIntPipe) authorId: number) {
        return this.authorService.getAuthorFollowersCount(authorId);
    }

    @ApiOperation({ summary: 'Получить количество поделившихся автором' })
    @Get(':id/share/count')
    getAuthorShares(@Param('id', ParseIntPipe) authorId: number) {
        return this.authorService.getAuthorShares(authorId);
    }

    @ApiOperation({ summary: 'Получить количество просмотров автора' })
    @Get(':id/views/count')
    getAuthorViewsCount(@Param('id', ParseIntPipe) authorId: number) {
        return this.authorService.getAuthorViewsCount(authorId);
    }
}