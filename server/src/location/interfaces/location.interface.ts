// src/location/interfaces/location.interface.ts
export interface Country {
    id: number;
    name: string;
    iso2: string;
    iso3: string;
    phone_code: string;
    currency?: string;
    region?: string;
}

export interface City {
    id: number;
    name: string;
    country_id: number;
    state_id?: number;
    latitude?: string;
    longitude?: string;
}

export interface State {
    id: number;
    name: string;
    country_id: number;
}