// src/location/location.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LocationApiService } from './location-api.service';
import { CountryDto } from './dto/country.dto';
import { CityDto } from './dto/city.dto';

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);

    constructor(
        private locationApiService: LocationApiService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    private generateCountryId(iso2: string): number {
        if (!iso2 || iso2.length < 2) return 0;
        return parseInt(iso2.charCodeAt(0).toString() + iso2.charCodeAt(1).toString());
    }

    async getAllCountries(lang: string = 'ru'): Promise<CountryDto[]> {
        const cacheKey = `countries_${lang}`;
        const cached = await this.cacheManager.get<CountryDto[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Fetching all countries (lang: ${lang})`);
        
        const data = await this.locationApiService.getAllCountries(lang);
        
        if (!data || !Array.isArray(data)) {
            this.logger.warn('⚠️ Received invalid data from API, returning empty array');
            return [];
        }

        const countries = data.map((country: any) => {
            const iso2 = country.cca2 || '';
            
            // ✅ В v5 название находится в country.name.common
            let name = country.name?.common || 'Unknown';
            
            // ✅ Переводы в v5 находятся в country.translations
            if (lang === 'ru' && country.translations?.rus?.common) {
                name = country.translations.rus.common;
            }

            return {
                id: this.generateCountryId(iso2),
                name: name,
                iso2: iso2,
            };
        });

        const validCountries = countries.filter(c => c.id > 0 && c.name && c.iso2);

        await this.cacheManager.set(cacheKey, validCountries, 86400000);
        this.logger.log(`✅ Cached ${validCountries.length} countries`);
        
        return validCountries;
    }

    async getCountryById(id: number, lang: string = 'ru'): Promise<CountryDto | null> {
        const cacheKey = `country_${id}_${lang}`;
        const cached = await this.cacheManager.get<CountryDto>(cacheKey);
        if (cached) return cached;

        const allCountries = await this.getAllCountries(lang);
        const country = allCountries.find(c => c.id === id);
        
        if (country) {
            await this.cacheManager.set(cacheKey, country, 86400000);
        }
        
        return country || null;
    }

    async getCountryByCode(isoCode: string, lang: string = 'ru'): Promise<CountryDto | null> {
        if (!isoCode) return null;
        
        const cacheKey = `country_code_${isoCode}_${lang}`;
        const cached = await this.cacheManager.get<CountryDto>(cacheKey);
        if (cached) return cached;

        const data = await this.locationApiService.getCountryByCode(isoCode);
        if (!data || Array.isArray(data)) return null;

        // ✅ В v5 название находится в data.name.common
        let name = data.name?.common || 'Unknown';
        
        // ✅ Переводы в v5 находятся в data.translations
        if (lang === 'ru' && data.translations?.rus?.common) {
            name = data.translations.rus.common;
        }

        const country = {
            id: this.generateCountryId(isoCode),
            name: name,
            iso2: isoCode,
        };

        await this.cacheManager.set(cacheKey, country, 86400000);
        return country;
    }

    async getCitiesByCountry(countryId: number, lang: string = 'ru'): Promise<CityDto[]> {
        const cacheKey = `cities_${countryId}_${lang}`;
        const cached = await this.cacheManager.get<CityDto[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        const country = await this.getCountryById(countryId);
        if (!country || !country.iso2) {
            this.logger.warn(`Country with ID ${countryId} not found`);
            return [];
        }

        this.logger.log(`📋 Fetching cities for country: ${country.iso2} (lang: ${lang})`);
        
        const data = await this.locationApiService.getCitiesByCountryCode(country.iso2, lang);
        
        if (!data || !Array.isArray(data)) {
            this.logger.warn(`⚠️ Received invalid cities data for ${country.iso2}`);
            return [];
        }

        const cities = data.map((city: any) => ({
            id: city.place_id || parseInt(city.geonameId) || Math.floor(Math.random() * 1000000) + Date.now(),
            name: city.display_name?.split(',')[0] || city.name || 'Unknown',
            country_id: country.id,
        }));

        await this.cacheManager.set(cacheKey, cities, 86400000);
        this.logger.log(`✅ Cached ${cities.length} cities for country ${country.name}`);

        return cities;
    }

    async getCitiesByCountryCode(isoCode: string, lang: string = 'ru'): Promise<CityDto[]> {
        if (!isoCode) return [];
        
        const cacheKey = `cities_code_${isoCode}_${lang}`;
        const cached = await this.cacheManager.get<CityDto[]>(cacheKey);
        if (cached) return cached;

        const country = await this.getCountryByCode(isoCode);
        if (!country) {
            this.logger.warn(`Country with ISO code ${isoCode} not found`);
            return [];
        }

        return this.getCitiesByCountry(country.id, lang);
    }

    async searchCountries(query: string, lang: string = 'ru'): Promise<CountryDto[]> {
        if (!query) return [];
        
        const allCountries = await this.getAllCountries(lang);
        const lowerQuery = query.toLowerCase();
        
        return allCountries.filter(country =>
            country.name.toLowerCase().includes(lowerQuery) ||
            country.iso2?.toLowerCase().includes(lowerQuery)
        );
    }

    async searchCities(countryId: number, query: string, lang: string = 'ru'): Promise<CityDto[]> {
        if (!query) return [];
        
        const cities = await this.getCitiesByCountry(countryId, lang);
        const lowerQuery = query.toLowerCase();
        
        return cities.filter(city =>
            city.name.toLowerCase().includes(lowerQuery)
        );
    }

    async clearCache(): Promise<void> {
        await this.cacheManager.clear();
        this.logger.log('🗑️ Cache cleared');
    }
}