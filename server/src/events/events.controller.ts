// src/events/events.controller.ts
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('События')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
    constructor(private eventsService: EventsService) {}

    @Post()
    @Roles(Role.Admin)
    @UseGuards(JwtAccessGuard, RolesGuard)
    @ApiOperation({ summary: 'Создать событие (только админ)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image'))
    async create(
        @Body() dto: CreateEventDto,
        @UploadedFile() image: any,
    ) {
        return this.eventsService.create(dto, image);
    }

    @Put(':id')
    @Roles(Role.Admin)
    @UseGuards(JwtAccessGuard, RolesGuard)
    @ApiOperation({ summary: 'Обновить событие (только админ)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image'))
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEventDto,
        @UploadedFile() image?: any,
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

    @Get('latest')
    @ApiOperation({ summary: 'Получить последние события для главной страницы' })
    async getLatest(@Query('limit') limit: number = 4) {
        return this.eventsService.getLatest(limit);
    }
}