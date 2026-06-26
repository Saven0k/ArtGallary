// src/location/location.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { Language } from '../translation/language.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('location')
@Controller('location')
export class LocationController {
    constructor(private locationService: LocationService) {}

    @ApiOperation({ summary: 'Получение всех стран' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries')
    async getAllCountries(@Language() lang: string) {
        return this.locationService.getAllCountries(lang);
    }

    @ApiOperation({ summary: 'Поиск стран по названию' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/search')
    async searchCountries(
        @Query('q') query: string,
        @Language() lang: string
    ) {
        return this.locationService.searchCountries(query, lang);
    }

    @ApiOperation({ summary: 'Получение страны по ID' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id')
    async getCountryById(
        @Param('id') id: number,
        @Language() lang: string
    ) {
        return this.locationService.getCountryById(id, lang);
    }

    @ApiOperation({ summary: 'Получение регионов/штатов страны' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id/states')
    async getStatesByCountry(
        @Param('id') id: number,
        @Language() lang: string
    ) {
        return this.locationService.getStatesByCountry(id, lang);
    }

    @ApiOperation({ summary: 'Получение городов страны' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id/cities')
    async getCitiesByCountry(
        @Param('id') id: number,
        @Language() lang: string
    ) {
        return this.locationService.getCitiesByCountry(id, lang);
    }
}