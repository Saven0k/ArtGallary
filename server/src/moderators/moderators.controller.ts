import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ModeratorsService } from './moderators.service';
import { CreateModeratorDto } from './dto/create-moderator.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Language } from 'src/translation/language.decorator';

@ApiTags('Модераторы')
@Controller('moderators')
export class ModeratorsController {
    constructor(private moderatorsService: ModeratorsService) { }

    @ApiOperation({ summary: 'Создание модератора' })
    @ApiConsumes('multipart/form-data')
    @Roles(Role.Admin)
    @Post()
    @UseInterceptors(FileInterceptor('avatar_path'))
    createModerator(
        @Body() dto: CreateModeratorDto,
        @UploadedFile() image: any,
        @CurrentUser('id') adminId: number
    ) {
        return this.moderatorsService.createModerator(dto, image, adminId);
    }

    @ApiOperation({ summary: 'Удаление модератора' })
    @Roles(Role.Admin)
    @Delete(':id')
    deleteModerator(@Param('id') id: string) {
        return this.moderatorsService.deleteModerator(parseInt(id));
    }

    @ApiOperation({ summary: 'Получение модератора по ID' })
    @Roles(Role.Admin)
    @Get(':id')
    getModeratorById(
        @Param('id') id: string,
        @Language() lang: string
    ) {
        return this.moderatorsService.getModeratorById(parseInt(id), lang);
    }

    @ApiOperation({ summary: 'Получение списка модераторов' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @Roles(Role.Admin)
    @Get()
    getModerators(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Language() lang: string
    ) {
        return this.moderatorsService.getModerators(parseInt(page), parseInt(limit), lang);
    }
}