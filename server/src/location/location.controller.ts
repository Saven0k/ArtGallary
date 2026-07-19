// src/location/location.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @ApiOperation({ summary: 'Поиск стран (autocomplete)' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос (минимум 2 символа)' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
  @Get('countries/search')
  async searchCountries(
    @Query('q') query: string,
    @Query('lang') lang: string = 'ru'
  ) {
    return this.locationService.searchCountries(query, lang);
  }

  @ApiOperation({ summary: 'Получение страны по ISO2 коду' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
  @Get('countries/:code')
  async getCountryByCode(
    @Param('code') code: string,
    @Query('lang') lang: string = 'ru'
  ) {
    return this.locationService.getCountryByCode(code, lang);
  }

  @ApiOperation({ summary: 'Поиск городов (autocomplete)' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос (минимум 2 символа)' })
  @ApiQuery({ name: 'countryCode', description: 'ISO2 код страны', required: false })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
  @Get('cities/search')
  async searchCities(
    @Query('q') query: string,
    @Query('countryCode') countryCode: string,
    @Query('lang') lang: string = 'ru'
  ) {
    return this.locationService.searchCities(query, countryCode, lang);
  }

  @ApiOperation({ summary: 'Получение городов по ISO2 коду страны' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
  @Get('countries/:code/cities')
  async getCitiesByCountryCode(
    @Param('code') code: string,
    @Query('lang') lang: string = 'ru'
  ) {
    return this.locationService.getCitiesByCountryCode(code, lang);
  }
}