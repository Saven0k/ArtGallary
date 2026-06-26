import { getAllCities, type City } from "../../../api/cities/main.api";
import { getAllCountries, type Country } from "../../../api/contries/main.api";
import { getAllGenres, type Genre } from "../../../api/genres/main.api";
import { getAllStyles, type Style } from "../../../api/styles/main.api";
export interface Option {
    id: number;
    name: string;
}

export const fetchCities = async (): Promise<Option[]> => {
    const data = await getAllCities();
    return data.map((city: City) => ({ id: city.id, name: city.name }));
};

export const fetchCountries = async (): Promise<Option[]> => {
    const response = await getAllCountries();
    return response.map((country: Country) => ({ id: country.id, name: country.name }));
};

export const fetchGenres = async (): Promise<Option[]> => {
    const data = await getAllGenres();
    return data.map((genre: Genre) => ({ id: genre.id, name: genre.title }));
};

export const fetchStyles = async (): Promise<Option[]> => {
    const data = await getAllStyles();
    return data.map((type: Style) => ({ id: type.id, name: type.name }));
};