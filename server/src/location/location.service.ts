import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HttpService } from '@nestjs/axios';
import { Op } from 'sequelize';
import { firstValueFrom } from 'rxjs';
import { Country } from './models/country.model';
import { City } from './models/city.model';


export interface CountryDto {
  id: number;
  name: string;
  iso2: string;
  iso3?: string;
  phone_code?: string;
  currency?: string;
  continent?: string;
}

export interface CityDto {
  id: number;
  name: string;
  country_code: string;
  region?: string;
  population?: number;
  timezone?: string;
}

type Lang = 'ru' | 'en';

@Injectable()
export class LocationService implements OnModuleInit {
  private readonly logger = new Logger(LocationService.name);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  private readonly nominatimCache = new Map<string, any>();

  constructor(
    @InjectModel(Country) private readonly countryModel: typeof Country,
    @InjectModel(City) private readonly cityModel: typeof City,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    const count = await this.countryModel.count();
    if (count === 0) {
      this.logger.warn(
        'Таблица стран пуста! Запустите сидер: npx ts-node src/location/seeders/geonames.seeder.ts',
      );
    } else {
      this.logger.log(`Сервис геолокации готов. Стран: ${count}`);
    }
  }

  async searchCountries(query: string, lang: Lang = 'ru'): Promise<CountryDto[]> {
    if (!query || query.length < 2) return [];

    const q = query.trim();

    // Ищем в БД — сначала те, что начинаются с запроса, потом содержат
    const [startsWith, contains] = await Promise.all([
      this.countryModel.findAll({
        where: {
          [Op.or]: [
            { name_ru: { [Op.iLike]: `${q}%` } },
            { name_en: { [Op.iLike]: `${q}%` } },
          ],
        },
        limit: 5,
        order: [['name_en', 'ASC']],
      }),
      this.countryModel.findAll({
        where: {
          [Op.or]: [
            { name_ru: { [Op.iLike]: `%${q}%` } },
            { name_en: { [Op.iLike]: `%${q}%` } },
          ],
        },
        limit: 10,
        order: [['name_en', 'ASC']],
      }),
    ]);

    const seen = new Set<number>();
    const merged: Country[] = [];

    for (const c of [...startsWith, ...contains]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }

    return merged.slice(0, 10).map(c => this.toCountryDto(c, lang));
  }


  async getCountryByCode(iso2: string, lang: Lang = 'ru'): Promise<CountryDto | null> {
    if (!iso2 || iso2.length !== 2) return null;

    const country = await this.countryModel.findOne({
      where: { iso2: iso2.toUpperCase() },
    });

    if (country) return this.toCountryDto(country, lang);

    this.logger.warn(`Страна ${iso2} не найдена в БД, запрашиваю Nominatim...`);
    return this.fetchCountryFromNominatim(iso2, lang);
  }


  async getCountryById(id: number, lang: Lang = 'ru'): Promise<CountryDto | null> {
    const country = await this.countryModel.findByPk(id);
    return country ? this.toCountryDto(country, lang) : null;
  }


  async getAllCountries(lang: Lang = 'ru'): Promise<CountryDto[]> {
    const countries = await this.countryModel.findAll({
      order: lang === 'ru'
        ? [['name_ru', 'ASC']]
        : [['name_en', 'ASC']],
    });
    return countries.map(c => this.toCountryDto(c, lang));
  }

  async searchCities(
    query: string,
    countryCode?: string,
    lang: Lang = 'ru',
  ): Promise<CityDto[]> {
    if (!query || query.length < 2) return [];

    const q = query.trim();
    const where: any = {
      [Op.or]: [
        { name_ru: { [Op.iLike]: `${q}%` } },
        { name_en: { [Op.iLike]: `${q}%` } },
      ],
    };

    if (countryCode) {
      where.country_code = countryCode.toUpperCase();
    }

    const cities = await this.cityModel.findAll({
      where,
      limit: 10,
      order: [['population', 'DESC']]
    });

    return cities.map(c => this.toCityDto(c, lang));
  }


  async getCitiesByCountryCode(
    iso2: string,
    lang: Lang = 'ru',
    limit: number = 50,
  ): Promise<CityDto[]> {
    if (!iso2 || iso2.length !== 2) return [];

    const cities = await this.cityModel.findAll({
      where: { country_code: iso2.toUpperCase() },
      order: [['population', 'DESC']],
      limit,
    });

    return cities.map(c => this.toCityDto(c, lang));
  }

  async getCityById(id: number, lang: Lang = 'ru'): Promise<CityDto | null> {
    const city = await this.cityModel.findByPk(id, {
      include: [{ model: Country, attributes: ['iso2', 'name_en', 'name_ru'] }],
    });
    return city ? this.toCityDto(city, lang) : null;
  }

  async getCityByGeonamesId(geonamesId: number, lang: Lang = 'ru'): Promise<CityDto | null> {
    const city = await this.cityModel.findOne({ where: { geonames_id: geonamesId } });
    return city ? this.toCityDto(city, lang) : null;
  }

  async resolveFilter(
    countryCode?: string,
    cityQuery?: string,
    lang: Lang = 'ru',
  ): Promise<{ country_id?: number; city_id?: number }> {
    const result: { country_id?: number; city_id?: number } = {};

    if (countryCode) {
      const country = await this.countryModel.findOne({
        where: { iso2: countryCode.toUpperCase() },
        attributes: ['id'],
      });
      if (country) result.country_id = country.id;
    }

    if (cityQuery && result.country_id) {
      const cities = await this.searchCities(cityQuery, countryCode, lang);
      if (cities.length > 0) result.city_id = cities[0].id;
    }

    return result;
  }

  private toCountryDto(country: Country, lang: Lang): CountryDto {
    return {
      id: country.id,
      name: lang === 'ru' ? (country.name_ru || country.name_en) : country.name_en,
      iso2: country.iso2,
      iso3: country.iso3,
      phone_code: country.phone_code,
      currency: country.currency,
      continent: country.continent,
    };
  }

  private toCityDto(city: City, lang: Lang): CityDto {
    return {
      id: city.id,
      name: lang === 'ru' ? (city.name_ru || city.name_en) : city.name_en,
      country_code: city.country_code,
      region: city.region,
      population: city.population,
      timezone: city.timezone,
    };
  }

  private async fetchCountryFromNominatim(
    iso2: string,
    lang: Lang,
  ): Promise<CountryDto | null> {
    const cacheKey = `country:${iso2}:${lang}`;
    if (this.nominatimCache.has(cacheKey)) {
      return this.nominatimCache.get(cacheKey);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.NOMINATIM_URL}/search`, {
          params: {
            q: iso2,
            format: 'json',
            limit: 1,
            featuretype: 'country',
            'accept-language': lang,
          },
          headers: { 'User-Agent': 'GalleryApp/1.0' },
        }),
      );

      if (!response.data.length) return null;

      const item = response.data[0];
      const name = item.display_name.split(',')[0].trim();
      const returnedIso2 =
        item.address?.country_code?.toUpperCase() || iso2.toUpperCase();

      // Сохраняем в БД чтобы в следующий раз брать из кэша
      const [country] = await this.countryModel.findOrCreate({
        where: { iso2: returnedIso2 },
        defaults: {
          iso2: returnedIso2,
          name_en: name,
          name_ru: lang === 'ru' ? name : null,
        } as any,
      });

      const dto = this.toCountryDto(country, lang);
      this.nominatimCache.set(cacheKey, dto);
      return dto;
    } catch (error) {
      this.logger.error(`Nominatim fallback failed for ${iso2}:`, error);
      return null;
    }
  }
}