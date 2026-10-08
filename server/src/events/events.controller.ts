import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_UPLOAD_OPTIONS, UploadedImage } from '../files/files.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ValidationPipe } from '../pipes/validation.pipe';

@ApiTags('События')
@ApiBearerAuth()
@Controller('events')
@UsePipes(ValidationPipe)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @ApiOperation({ summary: 'Создать событие (только админ)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', IMAGE_UPLOAD_OPTIONS))
  async create(
    @Body() dto: CreateEventDto,
    @UploadedFile() image: UploadedImage,
  ) {
    return this.eventsService.create(dto, image);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @ApiOperation({ summary: 'Обновить событие (только админ)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', IMAGE_UPLOAD_OPTIONS))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @UploadedFile() image?: UploadedImage,
  ) {
    return this.eventsService.update(id, dto, image);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @ApiOperation({ summary: 'Удалить событие (только админ)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.delete(id);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Получить последние события для главной страницы' })
  async getLatest(@Query('limit') limit: number = 4) {
    return this.eventsService.getLatest(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить событие по ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все события (с пагинацией)' })
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.eventsService.getAll(page, limit);
  }
}
