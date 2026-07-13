import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UploadedFile, UseInterceptors, UsePipes } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '../pipes/validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateuserDto } from './dto/update-user.dto';

@ApiTags("Пользователи")
@Controller('users')
export class UsersController {

    constructor(private userService: UsersService) { }

    @ApiOperation({ summary: 'Создание пользователя' })
    @UsePipes(ValidationPipe)
    @UseInterceptors(FileInterceptor('avatar_path'))
    @Post()
    create(@Body() userDto: CreateUserDto, @UploadedFile() image?: any) {
        return this.userService.createUser(userDto, image);
    }

    @ApiOperation({ summary: 'Обновление данных пользователя' })
    @Roles(Role.Admin, Role.Moderator, Role.User)
    @Patch('/:id')
    @UseInterceptors(FileInterceptor('avatar_path'))
    async updateUser(
        @Param('id') id: number,
        @Body() dto: UpdateuserDto,
        @UploadedFile() image?: any
    ) {
        return this.userService.updateUser(id, dto, image);
    }

    @Delete(`/:id`)
    @ApiOperation({ summary: 'Удаление пользователя по ID' })
    async deleteUser(@Param('id') id: number) {
        const result = await this.userService.deleteUserById(id);

        if (!result) {
            throw new NotFoundException(`Пользователь с ID ${id} не найден`);
        }

        return {
            message: 'Пользователь успешно удален',
            userId: id
        };
    }

    @ApiOperation({ summary: 'Получение списка пользователей' })
    @Get()
    getAll() {
        return this.userService.getAllUsers();
    }

    @ApiOperation({ summary: 'Получение пользователя по ID' })
    @Get(`/:id`)
    getUser(
        @Param('id') id: number
    ) {
        return this.userService.getUserById(id);
    }

    @ApiOperation({ summary: 'Получение данных профиля пользователя по ID' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get(`/:id/profile`)
    getUserData(
        @Param('id') id: number
    ) {
        return this.userService.getProfileData(id);
    }

    @ApiOperation({ summary: 'Восстановление пользователя' })
    @Roles(Role.Admin, Role.Moderator)
    @Post('/:id/restore')
    async restoreUser(@Param('id') id: number) {
        return this.userService.restoreUser(id);
    }

    @ApiOperation({ summary: 'Получение удаленных пользователей' })
    @Roles(Role.Admin, Role.Moderator)
    @Get('/deleted')
    async getDeletedUsers() {
        return this.userService.getDeletedUsers();
    }
}
