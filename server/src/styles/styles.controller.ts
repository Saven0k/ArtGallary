import {
  Body,
  Controller,
  ParseIntPipe,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
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
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StylesController {
  constructor(private stylesService: StylesService) {}

  @ApiOperation({ summary: 'Заполнение стилей начальными данными' })
  @Post('seed')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin)
  async seed() {
    return this.stylesService.seedStyles();
  }

  @ApiOperation({ summary: 'Добавление стиля' })
  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator, Role.Author)
  create(@Body() dto: CreateStyleDto) {
    return this.stylesService.create(dto);
  }

  @ApiOperation({ summary: 'Обновление стиля' })
  @Put('/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStyleDto) {
    return this.stylesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удаление стиля' })
  @Delete('/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.stylesService.delete(id);
  }

  @ApiOperation({ summary: 'Получение списка стилей' })
  @Get()
  getAll() {
    return this.stylesService.getAll();
  }

  @ApiOperation({ summary: 'Получение стиля по id' })
  @Get('/:id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.stylesService.getById(id);
  }
}
