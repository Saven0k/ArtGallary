// src/location/location-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Country, City, State } from './interfaces/location.interface';

@Injectable()
export class LocationApiService {
    private readonly logger = new Logger(LocationApiService.name);
    private readonly BASE_URL = 'https://city-state-country.vercel.app';

    constructor(private httpService: HttpService) {}

    async getAllCountries(): Promise<Country[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/countries`)
            );
            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch countries:', error);
            return [];
        }
    }

    async getCountryById(id: number): Promise<Country | null> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/countries/${id}`)
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch country ${id}:`, error);
            return null;
        }
    }

    async getStatesByCountry(countryId: number): Promise<State[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/countries/${countryId}/states`)
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch states for country ${countryId}:`, error);
            return [];
        }
    }

    async getCitiesByCountry(countryId: number): Promise<City[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/countries/${countryId}/cities`)
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch cities for country ${countryId}:`, error);
            return [];
        }
    }

    async searchCountries(query: string): Promise<Country[]> {
        try {
            const allCountries = await this.getAllCountries();
            return allCountries.filter(c => 
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.iso2.toLowerCase().includes(query.toLowerCase()) ||
                c.iso3.toLowerCase().includes(query.toLowerCase())
            );
        } catch (error) {
            this.logger.error(`Failed to search countries:`, error);
            return [];
        }
    }
}