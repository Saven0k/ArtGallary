// src/styles/styles.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CreateStyleDto } from './dto/create-style.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { StylesService } from './styles.service';
import { UpdateStyleDto } from './dto/update-style.dto';

@Controller('styles')
export class StylesController {
    constructor(private stylesService: StylesService) { }

    @ApiOperation({ summary: 'Заполнение стилей начальными данными' })
    @Post('seed')
    @Roles(Role.Admin)
    async seed() {
        return this.stylesService.seedStyles();
    }

    @ApiOperation({ summary: 'Добавление стиля' })
    @UsePipes(ValidationPipe)
    @Post()
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    create(@Body() dto: CreateStyleDto) {
        return this.stylesService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление стиля' })
    @UsePipes(ValidationPipe)
    @Put('/:id')
    @Roles(Role.Admin, Role.Moderator)
    update(@Param('id') id: number, @Body() dto: UpdateStyleDto) {
        return this.stylesService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление стиля' })
    @Delete("/:id")
    @Roles(Role.Admin, Role.Moderator)
    delete(@Param('id') id: number) { 
        return this.stylesService.delete(id);
    }

    @ApiOperation({ summary: 'Получение списка стилей' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    getAll() {
        return this.stylesService.getAll();
    }

    @ApiOperation({ summary: 'Получение стиля по id' })
    @Get("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    get(@Param('id') id: number) {
        return this.stylesService.getById(id);
    }
}