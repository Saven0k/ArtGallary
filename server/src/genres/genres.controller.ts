import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenresService } from './genres.service';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';

@ApiTags('Жанры')
@ApiBearerAuth()
@Controller('genres')
@UseGuards(JwtAccessGuard, RolesGuard)
export class GenresController {
    constructor(private genresService: GenresService) { }

    @ApiOperation({ summary: 'Заполнение начальными данными (жанры)' })
    @Post('seed')
    @Roles(Role.Admin)
    async seed() {
        return this.genresService.seedGenres();
    }

    @ApiOperation({ summary: 'Добавление нового жанра' })
    @Post()
    @Roles(Role.Admin, Role.Moderator)
    create(@Body() dto: CreateGenreDto) {
        return this.genresService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление жанра' })
    @Put('/:id')
    @Roles(Role.Admin, Role.Moderator)
    update(@Param('id') id: number, @Body() dto: UpdateGenreDto) {
        return this.genresService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление жанра' })
    @Delete("/:id")
    @Roles(Role.Admin, Role.Moderator)
    delete(@Param('id') id: number) {
        return this.genresService.delete(id);
    }

    @ApiOperation({ summary: 'Удаление всех жанров' })
    @Delete("/all")
    @Roles(Role.Admin, Role.Moderator)
    deleteAll() {
        return this.genresService.deleteAll();
    }

    @ApiOperation({ summary: 'Получение жанров по виду искусства' })
    @Get('by-art-type/:artTypeId')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getGenresByArtType(@Param('artTypeId') artTypeId: number) {
        return this.genresService.getGenresByArtType(artTypeId);
    }
    
    @ApiOperation({ summary: 'Получение списка жанров' })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAll() {
        return this.genresService.getAll();
    }

    @ApiOperation({ summary: 'Получение жанра по id' })
    @Get("/:id")
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    get(@Param('id') id: number) {
        return this.genresService.getById(id);
    }
}