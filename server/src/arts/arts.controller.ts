import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateArtDto } from './dto/create-art.dto';
import { ArtsService } from './arts.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateArtDTO } from './dto/update-art.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModerateArtDto } from './dto/moderate-art.dto';
import { Language } from 'src/translation/language.decorator';

@ApiTags("Arts")
@Controller('arts')
export class ArtsController {
    constructor(private artsService: ArtsService) { }

    @ApiOperation({ summary: 'Получения списка модерированных объектов' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('moderated')
    getModeratedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Language() lang?: string
    ) {
        return this.artsService.getModeratedArts(page || 1, limit || 10, lang);
    }

    @ApiOperation({ summary: 'Получения списка немодерированных объектов' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Get('unmoderated')
    getUnmoderatedArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Language() lang?: string
    ) {
        return this.artsService.getUnmoderatedArts(page || 1, limit || 10, lang);
    }

    @ApiOperation({ summary: 'Получения списка объектов' })
    @Roles(Role.Admin, Role.Moderator)
    @Get()
    getAllArts(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Language() lang?: string
    ) {
        return this.artsService.getAllArts(page || 1, limit || 10, lang);
    }

    @ApiOperation({ summary: 'Получение объекта по Id' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get("/:id")
    getArt(
        @Param("id") id: number,
        @Language() lang?: string
    ) {
        return this.artsService.getArtById(id, lang);
    }

    @ApiOperation({ summary: 'Создание нового объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Post()
    @UseInterceptors(FileInterceptor('image_path'))
    createArt(@Body() dto: CreateArtDto, @UploadedFile() image: any) {
        return this.artsService.createArt(dto, image, dto.artist_id);
    }

    @ApiOperation({ summary: 'Обновление объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Patch("/:id")
    updateArt(@Param("id") id: number, @Body() dto: UpdateArtDTO) {
        return this.artsService.updateArt(id, dto);
    }

    @ApiOperation({ summary: 'Удаление объекта' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist)
    @Delete("/:id")
    deleteArt(@Param("id") id: number) {
        return this.artsService.deleteArt(id);
    }

    @ApiOperation({ summary: 'Изменение модерации' })
    @Roles(Role.Admin, Role.Moderator)
    @Post("/:id/moderate")
    modarateArt(@Body() modarate: ModerateArtDto, @Param("id") id: number) {
        return this.artsService.moderateArt(modarate, id);
    }
}