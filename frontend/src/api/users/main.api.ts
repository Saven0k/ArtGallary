import { BASE_URL_API } from "../main.api";

export type UserRole = 'admin' | 'moderator' | 'artist' | 'user';
export type Gender = "M" | "F";

// === SERVER: users.model.ts ===
// id: integer auto-increment PK
// email: string unique not null
// password: string (hashed)
// name: string not null
// surname: string not null
// second_name: string not null
// phone_number: string not null
// avatar_path: string not null
// role: enum('admin','visitor','moderator','artist','user') not null
// gender: enum('M','F') not null
// is_deleted: boolean default false
// deleted_at: Date nullable
// country_id: int nullable FK to countries.id
// city_id: int nullable FK to cities.id

export interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name: string;
    phone_number: string;
    avatar_path: string;
    role: UserRole;
    gender: Gender;
    city_id?: number | null;
    country_id?: number | null;
    is_deleted?: boolean;
    deleted_at?: string | null;
    createdAt?: string;
    updatedAt?: string;
    artistProfile?: ArtistProfileData;
}

export interface ArtistProfileData {
    user_id: number;
    date_birthday?: string;
    biography?: string;
    moderate?: any;  // Server stores JSON string
    profession_id?: number;
    plan?: string;
    planExpiresAt?: string | null;
    planStatus?: boolean;
    likes?: number;
    views?: number;
    is_deleted?: boolean;
    deleted_at?: string | null;
    profession?: { id: number; name: string };
    artsCount?: number;
    totalLikes?: number;
    city?: { id: number; name: string } | null;
    country?: { id: number; name: string; iso2: string } | null;
    exhibitionsCount?: number;
}

export type UserProfile = Omit<User, 'password'>;

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    role: UserRole;
    avatar?: File;
    gender: Gender;
    city_id?: number | null;
    country_id?: number | null;
}

export interface UpdateUserData {
    email?: string;
    password?: string;
    name?: string;
    surname?: string;
    second_name?: string;
    phone_number?: string;
    avatar?: File;
    gender?: Gender;
    city_id?: number | null;
    country_id?: number | null;
}

const BASE_URL = `${BASE_URL_API}/users`;

export const getUserProfile = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/profile`, { credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("getUserProfile error:", e); return null; }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const res = await fetch(BASE_URL, { credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("getAllUsers error:", e); return []; }
};

export const getUserById = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("getUserById error:", e); }
};

export const createUser = async (data: CreateUserData): Promise<User | null> => {
    try {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("phone_number", data.phone_number);
        formData.append("role", data.role);
        formData.append("gender", data.gender);

        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));

        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.avatar) formData.append("avatar_path", data.avatar);

        const res = await fetch(BASE_URL, { method: "POST", credentials: "include", body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("createUser error:", e); return null; }
};

export const updateUser = async (userId: string | number, data: UpdateUserData): Promise<User | null> => {
    try {
        const formData = new FormData();
        if (data.email) formData.append("email", data.email);
        if (data.password) formData.append("password", data.password);
        if (data.name) formData.append("name", data.name);
        if (data.surname) formData.append("surname", data.surname);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.avatar) formData.append("avatar_path", data.avatar);
        if (data.gender) formData.append("gender", data.gender);

        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));

        const res = await fetch(`${BASE_URL}/${userId}`, { method: "PATCH", credentials: "include", body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("updateUser error:", e); return null; }
};

export const deleteUserById = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.log("deleteUserById error:", e); }
};
