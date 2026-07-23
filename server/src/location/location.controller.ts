import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('location')
@Controller('location')
@Roles(Role.Admin, Role.Moderator, Role.Artist, Role.Visitor, Role.User)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}


  @ApiOperation({ summary: 'Поиск стран (autocomplete, из БД, быстро)' })
  @ApiQuery({ name: 'q', description: 'Запрос (минимум 2 символа)' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'], example: 'ru' })
  @Get('countries/search')
  async searchCountries(
    @Query('q') query: string,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
  ) {
    return this.locationService.searchCountries(query, lang);
  }

  @ApiOperation({ summary: 'Все страны (для полного выпадающего списка)' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Get('countries')
  async getAllCountries(@Query('lang') lang: 'ru' | 'en' = 'ru') {
    return this.locationService.getAllCountries(lang);
  }

  @ApiOperation({ summary: 'Получить страну по ISO2 коду (RU, US, DE...)' })
  @ApiParam({ name: 'code', example: 'RU', description: 'ISO2 код страны' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Get('countries/by-code/:code')
  async getCountryByCode(
    @Param('code') code: string,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
  ) {
    return this.locationService.getCountryByCode(code, lang);
  }

  @ApiOperation({ summary: 'Получить страну по внутреннему ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Get('countries/:id')
  async getCountryById(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
  ) {
    return this.locationService.getCountryById(id, lang);
  }


  @ApiOperation({ summary: 'Поиск городов (autocomplete, из БД, быстро)' })
  @ApiQuery({ name: 'q', description: 'Запрос (минимум 2 символа)' })
  @ApiQuery({ name: 'countryCode', required: false, description: 'ISO2 код страны для фильтрации' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Get('cities/search')
  async searchCities(
    @Query('q') query: string,
    @Query('countryCode') countryCode?: string,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
  ) {
    return this.locationService.searchCities(query, countryCode, lang);
  }

  @ApiOperation({ summary: 'Получить город по внутреннему ID' })
  @ApiParam({ name: 'id', example: 524901 })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @Get('cities/:id')
  async getCityById(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
  ) {
    return this.locationService.getCityById(id, lang);
  }

  @ApiOperation({ summary: 'Топ городов страны (по населению)' })
  @ApiParam({ name: 'code', example: 'RU' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ru', 'en'] })
  @ApiQuery({ name: 'limit', required: false, description: 'Кол-во (default 50)' })
  @Get('countries/by-code/:code/cities')
  async getCitiesByCountryCode(
    @Param('code') code: string,
    @Query('lang') lang: 'ru' | 'en' = 'ru',
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.locationService.getCitiesByCountryCode(code, lang, limit);
  }
}