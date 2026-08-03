import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStyleDto } from './dto/create-style.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { StylesService } from './styles.service';
import { UpdateStyleDto } from './dto/update-style.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Стили')
@ApiBearerAuth()
@Controller('styles')
@UseGuards(JwtAccessGuard, RolesGuard)
export class StylesController {
    constructor(private stylesService: StylesService) { }

    @ApiOperation({ summary: 'Заполнение стилей начальными данными' })
    @Post('seed')
    @Roles(Role.Admin)
    async seed() {
        return this.stylesService.seedStyles();
    }

    @ApiOperation({ summary: 'Добавление стиля' })
    @Post()
    @Roles(Role.Admin, Role.Moderator, Role.Author)
    @UsePipes(ValidationPipe)
    create(@Body() dto: CreateStyleDto) {
        return this.stylesService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление стиля' })
    @Put('/:id')
    @Roles(Role.Admin, Role.Moderator)
    @UsePipes(ValidationPipe)
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
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAll() {
        return this.stylesService.getAll();
    }

    @ApiOperation({ summary: 'Получение стиля по id' })
    @Get("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    get(@Param('id') id: number) {
        return this.stylesService.getById(id);
    }
}