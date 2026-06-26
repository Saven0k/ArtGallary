import { Body, Controller, Delete, Get, Param, Post, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArtTypesService } from './art-types.service';
import { CreateArtTypeDto, UpdateArtTypeDto } from './dto/create-art-type.dto';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Language } from 'src/translation/language.decorator';

@ApiTags('Виды искусства')
@Controller('art-types')
export class ArtTypesController {
    constructor(private artTypesService: ArtTypesService) {}

    @ApiOperation({ summary: 'Заполнение начальными данными (виды искусства)' })
    @Post('seed')
    @Roles(Role.Admin)
    async seed() {
        return this.artTypesService.seedArtTypes();
    }

    @ApiOperation({ summary: 'Создание вида искусства' })
    @Post()
    @Roles(Role.Admin, Role.Moderator)
    @UsePipes(ValidationPipe)
    create(@Body() dto: CreateArtTypeDto) {
        return this.artTypesService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление вида искусства' })
    @Put('/:id')
    @Roles(Role.Admin, Role.Moderator)
    @UsePipes(ValidationPipe)
    update(@Param('id') id: number, @Body() dto: UpdateArtTypeDto) {
        return this.artTypesService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление вида искусства' })
    @Delete('/:id')
    @Roles(Role.Admin, Role.Moderator)
    delete(@Param('id') id: number) {
        return this.artTypesService.delete(id);
    }

    @ApiOperation({ summary: 'Получение списка видов искусства' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    getAll(@Language() lang: string) {
        return this.artTypesService.getAll(lang);
    }

    @ApiOperation({ summary: 'Получение вида искусства по id' })
    @Get('/:id')
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    get(@Param('id') id: number, @Language() lang: string) {
        return this.artTypesService.getById(id, lang);
    }
}