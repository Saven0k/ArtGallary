import { Body, Controller, Delete, Get, Param, Post, Put, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ArtTypesService } from './art-types.service';
import { CreateArtTypeDto } from './dto/create-art-type.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateArtTypeDto } from './dto/update-art-type.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('Виды искусства')
@ApiBearerAuth() 
@Controller('art-types')
@UseGuards(JwtAccessGuard, RolesGuard) 
export class ArtTypesController {
    constructor(private artTypesService: ArtTypesService) {}

    @ApiOperation({ summary: 'Заполнение начальными данными (виды искусства)' })
    @ApiResponse({ status: 200, description: 'Начальные данные успешно добавлены' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для администраторов' })
    @Post('seed')
    @Roles(Role.Admin) 
    async seed() {
        return this.artTypesService.seedArtTypes();
    }

    @ApiOperation({ summary: 'Создание вида искусства' })
    @ApiResponse({ status: 201, description: 'Вид искусства создан' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для администраторов и модераторов' })
    @Post()
    @Roles(Role.Admin, Role.Moderator)
    @UsePipes(ValidationPipe)
    create(@Body() dto: CreateArtTypeDto) {
        return this.artTypesService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление вида искусства' })
    @ApiResponse({ status: 200, description: 'Вид искусства обновлен' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для администраторов и модераторов' })
    @Put('/:id')
    @Roles(Role.Admin, Role.Moderator)
    @UsePipes(ValidationPipe)
    update(@Param('id') id: number, @Body() dto: UpdateArtTypeDto) {
        return this.artTypesService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление вида искусства' })
    @ApiResponse({ status: 200, description: 'Вид искусства удален' })
    @ApiResponse({ status: 403, description: 'Доступ запрещен. Только для администраторов и модераторов' })
    @Delete('/:id')
    @Roles(Role.Admin, Role.Moderator) // 👈 Админ и модератор
    delete(@Param('id') id: number) {
        return this.artTypesService.delete(id);
    }

    @ApiOperation({ summary: 'Получение списка видов искусства' })
    @ApiResponse({ status: 200, description: 'Список видов искусства' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAll() {
        return this.artTypesService.getAll();
    }

    @ApiOperation({ summary: 'Получение вида искусства по id' })
    @ApiResponse({ status: 200, description: 'Вид искусства найден' })
    @ApiResponse({ status: 404, description: 'Вид искусства не найден' })
    @Get('/:id')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    get(@Param('id') id: number) {
        return this.artTypesService.getById(id);
    }
}