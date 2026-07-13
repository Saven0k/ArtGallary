// src/location/location-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LocationApiService {
    private readonly logger = new Logger(LocationApiService.name);
    // ✅ Правильный URL для API с ключом
    private readonly BASE_URL = 'https://api.restcountries.com/v3.1';
    private readonly API_KEY: string;

    constructor(private httpService: HttpService) {
        this.API_KEY = process.env.REST_COUNTRIES_API_KEY || '';
        if (!this.API_KEY) {
            this.logger.warn('⚠️ REST_COUNTRIES_API_KEY не установлен!');
        }
    }

    /**
     * Получение всех стран через RestCountries API v3.1
     */
    async getAllCountries(lang: string = 'ru'): Promise<any[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/all`, {
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`, 
                    },
                    params: {
                        fields: 'name,cca2,translations',
                    },
                })
            );

            if (!response.data || !Array.isArray(response.data)) {
                this.logger.warn('⚠️ Invalid response from RestCountries API');
                return [];
            }

            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch countries:', error);
            return [];
        }
    }

    /**
     * Получение страны по ISO коду
     */
    async getCountryByCode(isoCode: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/alpha/${isoCode}`, {
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`,
                    },
                    params: {
                        fields: 'name,cca2,translations',
                    },
                })
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch country ${isoCode}:`, error);
            return null;
        }
    }

    /**
     * Получение городов через OpenStreetMap Nominatim (бесплатно, без ключа)
     */
    async getCitiesByCountryCode(countryCode: string, lang: string = 'ru'): Promise<any[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        countrycodes: countryCode,
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

            if (!response.data || !Array.isArray(response.data)) {
                this.logger.warn(`⚠️ Invalid response from Nominatim for ${countryCode}`);
                return [];
            }

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch cities for country ${countryCode}:`, error);
            return [];
        }
    }
}