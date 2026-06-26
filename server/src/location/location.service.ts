// src/location/location.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LocationApiService } from './location-api.service';
import { TranslationService } from '../translation/translation.service';
import { Country, City, State } from './interfaces/location.interface';

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

    constructor(
        private locationApiService: LocationApiService,
        private translationService: TranslationService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getAllCountries(lang: string = 'ru'): Promise<Country[]> {
        const cacheKey = `countries_${lang}`;
        
        const cached = await this.cacheManager.get<Country[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Fetching all countries (lang: ${lang})`);
        
        let countries = await this.locationApiService.getAllCountries();
        
        if (lang && lang !== 'ru') {
            countries = await this.translationService.translateEntities(
                countries,
                'country',
                lang
            );
        }

        await this.cacheManager.set(cacheKey, countries, this.CACHE_TTL);
        
        return countries;
    }

    async getCountryById(id: number, lang: string = 'ru'): Promise<Country | null> {
        const cacheKey = `country_${id}_${lang}`;
        
        const cached = await this.cacheManager.get<Country>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Fetching country ${id} (lang: ${lang})`);
        
        let country = await this.locationApiService.getCountryById(id);
        
        if (country && lang && lang !== 'ru') {
            country = await this.translationService.translateEntity(
                country,
                'country',
                id,
                lang
            );
        }

        if (country) {
            await this.cacheManager.set(cacheKey, country, this.CACHE_TTL);
        }
        
        return country;
    }

    async getCitiesByCountry(countryId: number, lang: string = 'ru'): Promise<City[]> {
        const cacheKey = `cities_${countryId}_${lang}`;
        
        const cached = await this.cacheManager.get<City[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Fetching cities for country ${countryId} (lang: ${lang})`);
        
        let cities = await this.locationApiService.getCitiesByCountry(countryId);
        
        if (lang && lang !== 'ru') {
            cities = await this.translationService.translateEntities(
                cities,
                'city',
                lang
            );
        }

        await this.cacheManager.set(cacheKey, cities, this.CACHE_TTL);
        
        return cities;
    }

    async getStatesByCountry(countryId: number, lang: string = 'ru'): Promise<State[]> {
        const cacheKey = `states_${countryId}_${lang}`;
        
        const cached = await this.cacheManager.get<State[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Fetching states for country ${countryId} (lang: ${lang})`);
        
        let states = await this.locationApiService.getStatesByCountry(countryId);
        
        if (lang && lang !== 'ru') {
            states = await this.translationService.translateEntities(
                states,
                'state',
                lang
            );
        }

        await this.cacheManager.set(cacheKey, states, this.CACHE_TTL);
        
        return states;
    }

    async searchCountries(query: string, lang: string = 'ru'): Promise<Country[]> {
        const cacheKey = `search_${query}_${lang}`;
        
        const cached = await this.cacheManager.get<Country[]>(cacheKey);
        if (cached) {
            this.logger.debug(`✅ Cache hit: ${cacheKey}`);
            return cached;
        }

        this.logger.log(`📋 Searching countries: ${query} (lang: ${lang})`);
        
        let results = await this.locationApiService.searchCountries(query);
        
        if (lang && lang !== 'ru') {
            results = await this.translationService.translateEntities(
                results,
                'country',
                lang
            );
        }

        await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
        
        return results;
    }

    async validateLocation(countryId: number, cityId?: number): Promise<boolean> {
        const country = await this.locationApiService.getCountryById(countryId);
        if (!country) {
            throw new Error('Страна не найдена');
        }

        if (cityId) {
            const cities = await this.locationApiService.getCitiesByCountry(countryId);
            const cityExists = cities.some(c => c.id === cityId);
            if (!cityExists) {
                throw new Error('Город не принадлежит выбранной стране');
            }
        }

        return true;
    }

    // Метод для получения полной информации о локации артиста
    async getArtistLocation(countryId: number, cityId: number | null, lang: string = 'ru') {
        const country = await this.getCountryById(countryId, lang);
        let city = null;
        
        if (cityId) {
            const cities = await this.getCitiesByCountry(countryId, lang);
            city = cities.find(c => c.id === cityId);
        }

        return {
            country,
            city,
            country_id: countryId,
            city_id: cityId,
        };
    }
}