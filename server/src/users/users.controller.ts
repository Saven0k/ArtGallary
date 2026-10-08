import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
  UsePipes,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { IMAGE_UPLOAD_OPTIONS } from '../files/files.service';
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
import {
  CurrentUser,
  type CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { AuthorFollowService } from 'src/authors/author-follow.service';
import { AccountDeletionGuard } from '../auth/guards/account-deletion.guard';

@ApiTags('Пользователи')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAccessGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class UsersController {
  constructor(
    private userService: UsersService,
    private followService: AuthorFollowService,
  ) {}

  @Get()
  @Roles(Role.Admin, Role.Moderator)
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

  @Get('following')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Получить подписки пользователя' })
  async getUserFollowing(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followService.getUserFollowing(user.id, page, limit);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Moderator, Role.User, Role.Author, Role.Visitor)
  @ApiOperation({ summary: 'Получение пользователя по ID' })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Get(':id/profile')
  @Roles(Role.Admin, Role.Moderator, Role.User, Role.Author, Role.Visitor)
  @ApiOperation({ summary: 'Получение данных профиля пользователя по ID' })
  async getUserData(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (
      user.role !== Role.Admin &&
      user.role !== Role.Moderator &&
      user.id !== id
    ) {
      throw new ForbiddenException(
        'Вы можете просматривать только свой профиль',
      );
    }
    return this.userService.getProfileData(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Создание пользователя' })
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('avatar_path', IMAGE_UPLOAD_OPTIONS))
  create(@Body() userDto: CreateUserDto) {
    return this.userService.createUser(userDto);
  }

  @Post(':id/restore')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Восстановление пользователя' })
  async restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.restoreUser(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Moderator, Role.User)
  @ApiOperation({ summary: 'Обновление данных пользователя' })
  @UseInterceptors(FileInterceptor('avatar_path', IMAGE_UPLOAD_OPTIONS))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateuserDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    if (
      user.role !== Role.Admin &&
      user.role !== Role.Moderator &&
      user.id !== id
    ) {
      throw new ForbiddenException(
        'Вы можете редактировать только свой профиль',
      );
    }
    if (
      user.role !== Role.Admin &&
      user.role !== Role.Moderator &&
      (dto.email !== undefined || dto.password !== undefined)
    ) {
      throw new ForbiddenException(
        'Используйте подтверждение смены email или пароля',
      );
    }
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountDeletionGuard)
  @Roles(Role.Admin, Role.Moderator, Role.User)
  @ApiOperation({ summary: 'Удаление пользователя по ID' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (
      user.role !== Role.Admin &&
      user.role !== Role.Moderator &&
      user.id !== id
    ) {
      throw new ForbiddenException('Вы можете удалить только свой профиль');
    }

    const result = await this.userService.deleteUserById(id);

    if (!result) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return {
      message: 'Пользователь успешно удален',
      userId: id,
    };
  }

  @Get(':id/follow/check')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Проверить подписку' })
  async checkFollow(
    @Param('id', ParseIntPipe) authorId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.followService.checkFollow(user.id, authorId);
  }

  @Post(':id/follow')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Подписаться/отписаться от автора' })
  async toggleFollow(
    @Param('id', ParseIntPipe) authorId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.followService.toggleFollow(user.id, authorId);
  }
}
