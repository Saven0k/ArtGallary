// src/api/events/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/events`;

export interface Event {
    id: number;
    title: string;
    image: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface CreateEventData {
    title: string;
    description: string;
    image: File;
}

export interface UpdateEventData {
    title?: string;
    description?: string;
    image?: File;
}

export interface EventsResponse {
    data: Event[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export const getEvents = async (page: number = 1, limit: number = 10): Promise<EventsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getEvents error:", e);
        return null;
    }
};

export const getLatestEvents = async (limit: number = 4): Promise<Event[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/latest?limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getLatestEvents error:", e);
        return null;
    }
};

export const getEventById = async (id: number): Promise<Event | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getEventById error:", e);
        return null;
    }
};

export const createEvent = async (data: CreateEventData): Promise<Event | null> => {
    try {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        if (data.image) {
            formData.append("image", data.image);
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("createEvent error:", e);
        return null;
    }
};

export const updateEvent = async (id: number, data: UpdateEventData): Promise<Event | null> => {
    try {
        const formData = new FormData();
        if (data.title) formData.append("title", data.title);
        if (data.description) formData.append("description", data.description);
        if (data.image) {
            formData.append("image", data.image);
        }

        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("updateEvent error:", e);
        return null;
    }
};

export const deleteEvent = async (id: number): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("deleteEvent error:", e);
        return null;
    }
};