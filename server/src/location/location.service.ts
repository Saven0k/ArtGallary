// src/location/location.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  constructor(private httpService: HttpService) { }

  /**
   * Поиск стран (возвращает с ISO2 кодом)
   */
  async searchCountries(query: string, lang: string = 'ru'): Promise<{ id: string; name: string; iso2: string }[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.NOMINATIM_URL}/search`, {
          params: {
            q: query,
            format: 'json',
            limit: 5,
            featuretype: 'country',
            'accept-language': lang,
          },
          headers: {
            'User-Agent': 'GalleryApp/1.0',
          },
        })
      );

      return response.data.map((item: any) => {
        // ✅ Извлекаем ISO2 код из address.country_code
        let iso2 = item.address?.country_code?.toUpperCase() || '';
        
        // ✅ Если не нашли в address, пробуем получить из других полей
        if (!iso2) {
          // Некоторые ответы могут содержать код в display_name
          const parts = item.display_name?.split(',') || [];
          const lastPart = parts[parts.length - 1]?.trim();
          if (lastPart && lastPart.length === 2) {
            iso2 = lastPart.toUpperCase();
          }
        }
        
        // ✅ Если все еще нет, пробуем из class и type
        if (!iso2 && item.class === 'boundary' && item.type === 'administrative') {
          // Для некоторых стран код может быть в osm_id
          const osmType = item.osm_type;
          const osmId = item.osm_id;
          // Здесь можно было бы сделать дополнительный запрос, но пока оставляем пустым
        }

        return {
          id: String(item.place_id),
          name: item.display_name.split(',')[0] || item.display_name,
          iso2: iso2 || 'RU', // ✅ Fallback для России
        };
      });
    } catch (error) {
      this.logger.error(`Failed to search countries for "${query}":`, error);
      return [];
    }
  }

  /**
   * Получение страны по ISO2 коду (основной метод)
   */
  async getCountryByCode(iso2: string, lang: string = 'ru'): Promise<{ id: string; name: string; iso2: string } | null> {
    if (!iso2 || iso2.length !== 2) return null;

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
          headers: {
            'User-Agent': 'GalleryApp/1.0',
          },
        })
      );

      if (response.data.length === 0) return null;

      const item = response.data[0];
      return {
        id: String(item.place_id),
        name: item.display_name.split(',')[0] || item.display_name,
        iso2: item.address?.country_code?.toUpperCase() || iso2,
      };
    } catch (error) {
      this.logger.error(`Failed to get country by code ${iso2}:`, error);
      return null;
    }
  }

  /**
   * Получение городов по ISO2 коду страны
   */
  async getCitiesByCountryCode(iso2: string, lang: string = 'ru'): Promise<{ id: string; name: string; country_code: string }[]> {
    if (!iso2 || iso2.length !== 2) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.NOMINATIM_URL}/search`, {
          params: {
            countrycodes: iso2,
            format: 'json',
            limit: 50,
            featuretype: 'city',
            'accept-language': lang,
          },
          headers: {
            'User-Agent': 'GalleryApp/1.0',
          },
        })
      );

      return response.data.map((item: any) => ({
        id: String(item.place_id),
        name: item.display_name.split(',')[0] || item.display_name,
        country_code: iso2,
      }));
    } catch (error) {
      this.logger.error(`Failed to get cities for country ${iso2}:`, error);
      return [];
    }
  }

  /**
   * Поиск городов с фильтром по стране
   */
  async searchCities(query: string, countryIso2?: string, lang: string = 'ru'): Promise<{ id: string; name: string; country_code: string }[]> {
    if (!query || query.length < 2) return [];

    try {
      const params: any = {
        q: query,
        format: 'json',
        limit: 5,
        featuretype: 'city',
        'accept-language': lang,
      };

      if (countryIso2) {
        params.countrycodes = countryIso2;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.NOMINATIM_URL}/search`, {
          params,
          headers: {
            'User-Agent': 'GalleryApp/1.0',
          },
        })
      );

      return response.data.map((item: any) => ({
        id: String(item.place_id),
        name: item.display_name.split(',')[0] || item.display_name,
        country_code: item.address?.country_code?.toUpperCase() || countryIso2 || '',
      }));
    } catch (error) {
      this.logger.error(`Failed to search cities for "${query}":`, error);
      return [];
    }
  }
}