import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ModeratorsService } from './moderators.service';
import { CreateModeratorDto } from './dto/create-moderator.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('Модераторы')
@ApiBearerAuth()
@Controller('moderators')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ModeratorsController {
    constructor(private moderatorsService: ModeratorsService) { }

    @ApiOperation({ summary: 'Создание модератора' })
    @ApiConsumes('multipart/form-data')
    @Post()
    @Roles(Role.Admin)
    @UseInterceptors(FileInterceptor('avatar_path'))
    createModerator(
        @Body() dto: CreateModeratorDto,
        @UploadedFile() image: any,
        @CurrentUser('id') adminId: number
    ) {
        return this.moderatorsService.createModerator(dto, image, adminId);
    }

    @ApiOperation({ summary: 'Удаление модератора' })
    @Delete(':id')
    @Roles(Role.Admin)
    deleteModerator(@Param('id') id: string) {
        return this.moderatorsService.deleteModerator(parseInt(id));
    }

    @ApiOperation({ summary: 'Получение модератора по ID' })
    @Get(':id')
    @Roles(Role.Admin)
    getModeratorById(@Param('id') id: string) {
        return this.moderatorsService.getModeratorById(parseInt(id));
    }

    @ApiOperation({ summary: 'Получение списка модераторов' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @Get()
    @Roles(Role.Admin)
    getModerators(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        return this.moderatorsService.getModerators(parseInt(page), parseInt(limit));
    }
}