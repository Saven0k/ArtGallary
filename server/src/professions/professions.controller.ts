import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfessionsService } from './professions.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';
import { Profession } from './profession.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('professions')
@Controller('professions')
export class ProfessionsController {
    constructor(private professionsService: ProfessionsService) {}

    @ApiOperation({ summary: 'Создание новой профессии' })
    @ApiResponse({ status: 201, type: Profession })
    @Roles(Role.Admin, Role.Moderator)
    @Post()
    create(@Body() dto: CreateProfessionDto): Promise<Profession> {
        return this.professionsService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление профессии' })
    @ApiResponse({ status: 200, type: Profession })
    @Roles(Role.Admin, Role.Moderator)
    @Put(':id')
    update(
        @Param('id') id: number,
        @Body() dto: UpdateProfessionDto
    ): Promise<Profession> {
        return this.professionsService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление профессии' })
    @ApiResponse({ status: 200 })
    @Roles(Role.Admin, Role.Moderator)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    delete(@Param('id') id: number): Promise<{ success: boolean; message: string }> {
        return this.professionsService.delete(id);
    }

    @ApiOperation({ summary: 'Получение всех профессий' })
    @ApiResponse({ status: 200, type: [Profession] })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get()
    getAll(): Promise<Profession[]> {
        return this.professionsService.getAll();
    }

    @ApiOperation({ summary: 'Получение профессии по ID' })
    @ApiResponse({ status: 200, type: Profession })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get(':id')
    getById(@Param('id') id: number): Promise<Profession> {
        return this.professionsService.getById(id);
    }
}