import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionsService } from './professions.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';
import { Profession } from './profession.model';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('professions')
@ApiBearerAuth()
@Controller('professions')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ProfessionsController {
    constructor(private professionsService: ProfessionsService) {}

    @ApiOperation({ summary: 'Создание новой профессии' })
    @ApiResponse({ status: 201, type: Profession })
    @Post()
    @Roles(Role.Admin, Role.Moderator)
    create(@Body() dto: CreateProfessionDto): Promise<Profession> {
        return this.professionsService.create(dto);
    }

    @ApiOperation({ summary: 'Обновление профессии' })
    @ApiResponse({ status: 200, type: Profession })
    @Put(':id')
    @Roles(Role.Admin, Role.Moderator)
    update(
        @Param('id') id: number,
        @Body() dto: UpdateProfessionDto
    ): Promise<Profession> {
        return this.professionsService.update(id, dto);
    }

    @ApiOperation({ summary: 'Удаление профессии' })
    @ApiResponse({ status: 200 })
    @Delete(':id')
    @Roles(Role.Admin, Role.Moderator)
    @HttpCode(HttpStatus.OK)
    delete(@Param('id') id: number): Promise<{ success: boolean; message: string }> {
        return this.professionsService.delete(id);
    }

    @ApiOperation({ summary: 'Получение всех профессий' })
    @ApiResponse({ status: 200, type: [Profession] })
    @Get()
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getAll(): Promise<Profession[]> {
        return this.professionsService.getAll();
    }

    @ApiOperation({ summary: 'Получение профессии по ID' })
    @ApiResponse({ status: 200, type: Profession })
    @Get(':id')
    @Roles(Role.Admin, Role.Moderator, Role.Author, Role.Visitor, Role.User)
    getById(@Param('id') id: number): Promise<Profession> {
        return this.professionsService.getById(id);
    }
}