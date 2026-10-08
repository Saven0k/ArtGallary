import {
  Body,
  Controller,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
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
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GenresController {
  constructor(private genresService: GenresService) {}

  @ApiOperation({ summary: 'Заполнение начальными данными (жанры)' })
  @Post('seed')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin)
  async seed() {
    return this.genresService.seedGenres();
  }

  @ApiOperation({ summary: 'Добавление нового жанра' })
  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  create(@Body() dto: CreateGenreDto) {
    return this.genresService.create(dto);
  }

  @ApiOperation({ summary: 'Обновление жанра' })
  @Put('/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGenreDto) {
    return this.genresService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление всех жанров' })
  @Delete('/all')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  deleteAll() {
    return this.genresService.deleteAll();
  }

  @ApiOperation({ summary: 'Удаление жанра' })
  @Delete('/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.genresService.delete(id);
  }

  @ApiOperation({ summary: 'Получение жанров по виду искусства' })
  @Get('by-art-type/:artTypeId')
  getGenresByArtType(@Param('artTypeId', ParseIntPipe) artTypeId: number) {
    return this.genresService.getGenresByArtType(artTypeId);
  }

  @ApiOperation({ summary: 'Получение списка жанров' })
  @Get()
  getAll() {
    return this.genresService.getAll();
  }

  @ApiOperation({ summary: 'Получение жанра по id' })
  @Get('/:id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.genresService.getById(id);
  }
}
