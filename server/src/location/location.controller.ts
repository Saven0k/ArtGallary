// src/location/location.controller.ts
import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CountryDto } from './dto/country.dto';
import { CityDto } from './dto/city.dto';

@ApiTags('location')
@Controller('location')
export class LocationController {
    constructor(private locationService: LocationService) { }

    @ApiOperation({ summary: 'Получение всех стран' })
    @Get('countries')
    async getAllCountries(): Promise<CountryDto[]> {
        return this.locationService.getAllCountries();
    }

    @ApiOperation({ summary: 'Поиск стран' })
    @ApiQuery({ name: 'q', description: 'Поисковый запрос' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/search')
    async searchCountries(
        @Query('q') query: string,
    ): Promise<CountryDto[]> {
        return this.locationService.searchCountries(query);
    }

    @ApiOperation({ summary: 'Получение страны по ID' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id')
    async getCountryById(
        @Param('id') id: number
    ): Promise<CountryDto | null> {
        return this.locationService.getCountryById(id);
    }

    @ApiOperation({ summary: 'Получение страны по ISO коду' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/iso/:code')
    async getCountryByCode(
        @Param('code') code: string
    ): Promise<CountryDto | null> {
        return this.locationService.getCountryByCode(code);
    }

    @ApiOperation({ summary: 'Получение городов по ID страны' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id/cities')
    async getCitiesByCountry(
        @Param('id') id: number
    ): Promise<CityDto[]> {
        return this.locationService.getCitiesByCountry(id);
    }

    @ApiOperation({ summary: 'Получение городов по ISO коду страны' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/iso/:code/cities')
    async getCitiesByCode(
        @Param('code') code: string
    ): Promise<CityDto[]> {
        return this.locationService.getCitiesByCountryCode(code);
    }

    @ApiOperation({ summary: 'Поиск городов в стране' })
    @ApiQuery({ name: 'q', description: 'Поисковый запрос' })
    @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
    @Get('countries/:id/cities/search')
    async searchCities(
        @Param('id') id: number,
        @Query('q') query: string
    ): Promise<CityDto[]> {
        return this.locationService.searchCities(id, query);
    }

    @ApiOperation({ summary: 'Очистка кэша' })
    @Roles(Role.Admin)
    @Post('cache/clear')
    async clearCache() {
        await this.locationService.clearCache();
        return { message: 'Cache cleared successfully' };
    }
}