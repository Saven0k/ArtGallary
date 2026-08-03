import { getAllGenres, type Genre } from "../../../api/genres/main.api";
import { getAllStyles, type Style } from "../../../api/styles/main.api";

export interface Option {
    id: number;
    name: string;
}

let lang = 'ru';

export const setLang = (l: string) => { lang = l; };

export const fetchGenres = async (): Promise<Option[]> => {
    const data = await getAllGenres();
    return data.map((g: Genre) => ({ id: g.id, name: g.title }));
};

export const fetchStyles = async (): Promise<Option[]> => {
    const data = await getAllStyles();
    return data.map((s: Style) => ({ id: s.id, name: s.name }));
};