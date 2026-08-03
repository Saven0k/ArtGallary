import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UploadedFile, UseInterceptors, UsePipes, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ValidationPipe } from '../pipes/validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateuserDto } from './dto/update-user.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthorFollowService } from 'src/authors/author-follow.service';

@ApiTags("Пользователи")
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersController {
    constructor(private userService: UsersService,  private followService: AuthorFollowService) { }

    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.User, Role.Author, Role.Visitor)
    @ApiOperation({ summary: 'Получение списка пользователей' })
    getAll() {
        return this.userService.getAllUsers();
    }

    @Get('deleted')
    @Roles(Role.Admin, Role.Moderator)
    @ApiOperation({ summary: 'Получение удаленных пользователей' })
    async getDeletedUsers() {
        return this.userService.getDeletedUsers();
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Moderator, Role.User, Role.Author, Role.Visitor)
    @ApiOperation({ summary: 'Получение пользователя по ID' })
    getUser(@Param('id') id: number) {
        return this.userService.getUserById(id);
    }

    @Get(':id/profile')
    @Roles(Role.Admin, Role.Moderator, Role.User, Role.Author, Role.Visitor)
    @ApiOperation({ summary: 'Получение данных профиля пользователя по ID' })
    async getUserData(
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== id) {
            throw new ForbiddenException('Вы можете просматривать только свой профиль');
        }
        return this.userService.getProfileData(id);
    }

    @Post()
    @Roles(Role.Admin, Role.Moderator)
    @ApiOperation({ summary: 'Создание пользователя' })
    @UsePipes(ValidationPipe)
    @UseInterceptors(FileInterceptor('avatar_path'))
    create(@Body() userDto: CreateUserDto, @UploadedFile() image?: any) {
        return this.userService.createUser(userDto, image);
    }

    @Post(':id/restore')
    @Roles(Role.Admin, Role.Moderator)
    @ApiOperation({ summary: 'Восстановление пользователя' })
    async restoreUser(@Param('id') id: number) {
        return this.userService.restoreUser(id);
    }

    @Patch(':id')
    @Roles(Role.Admin, Role.Moderator, Role.User)
    @ApiOperation({ summary: 'Обновление данных пользователя' })
    @UseInterceptors(FileInterceptor('avatar_path'))
    async updateUser(
        @Param('id') id: number,
        @Body() dto: UpdateuserDto,
        @UploadedFile() image?: any,
        @CurrentUser() user?: any
    ) {
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== id) {
            throw new ForbiddenException('Вы можете редактировать только свой профиль');
        }
        return this.userService.updateUser(id, dto, image);
    }

    @Delete(':id')
    @Roles(Role.Admin, Role.Moderator, Role.User)
    @ApiOperation({ summary: 'Удаление пользователя по ID' })
    async deleteUser(
        @Param('id') id: number,
        @CurrentUser() user: any
    ) {
        if (user.role !== Role.Admin && user.role !== Role.Moderator && user.id !== id) {
            throw new ForbiddenException('Вы можете удалить только свой профиль');
        }

        const result = await this.userService.deleteUserById(id);

        if (!result) {
            throw new NotFoundException(`Пользователь с ID ${id} не найден`);
        }

        return {
            message: 'Пользователь успешно удален',
            userId: id
        };
    }

    @Get(':id/follow/check')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Проверить подписку' })
    async checkFollow(
        @Param('id') authorId: number,
        @CurrentUser() user: any,
    ) {
        return this.followService.checkFollow(user.id, authorId);
    }

    @Get('following')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Получить подписки пользователя' })
    async getUserFollowing(
        @CurrentUser() user: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.followService.getUserFollowing(user.id, page, limit);
    }

    @Post(':id/follow')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Подписаться/отписаться от автора' })
    async toggleFollow(
        @Param('id') authorId: number,
        @CurrentUser() user: any,
    ) {
        return this.followService.toggleFollow(user.id, authorId);
    }
}