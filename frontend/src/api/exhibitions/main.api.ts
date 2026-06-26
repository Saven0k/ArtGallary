import type { Genre } from "../genres/main.api";
import { BASE_URL_API } from "../main.api";
import type { Style } from "../styles/main.api";

const BASE_URL = `${BASE_URL_API}/exhibitions`;

export interface ModerateData {
    moderate: boolean;
    moderator_id: number | null;
    errors: Record<string, string>;
    moderated_at?: string | null;
    comment?: string | null;
}

export interface Exhibition {
    id: number;
    title: string;
    description: string;
    address: string;
    date: string;
    cost: string;
    currency?: string;
    image_path?: string;
    visitors_count: number;
    likes?: number,
    moderate?: ModerateData;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    genre_id?: number;
    owner_id?: number;
    city?: { id: number; name: string } | null;
    country?: { id: number; name: string } | null;
    type?: Style | null;
    genre?: Genre | null;
    arts?: Array<{
        id: number;
        title: string;
        image_path: string;
        cost?: number;
        likes?: number;
    }>;
    artists?: Array<{
        user_id: number;
        user?: {
            id: number;
            name: string;
            surname: string;
            avatar_path?: string | null;
        };
    }>;
}

export interface CreateExhibitionDto {
    title: string;
    description: string;
    address: string;
    date: string;
    cost: string;
    currency?: string;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    genre_id?: number;
    image_path?: File | null;
    owner_id?: number;
}

export interface UpdateExhibitionDto {
    title?: string;
    description?: string;
    address?: string;
    date?: string;
    cost?: string;
    currency?: string;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    genre_id?: number;
    image_path?: File | null;
    likes?: number
}

export interface ModerateExhibitionDto {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}

export interface ExhibitionsResponse {
    data: Exhibition[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export const getAllExhibitions = async (page: number = 1, limit: number = 10, lang: string = 'ru'): Promise<ExhibitionsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getAllExhibitions error:", e);
        return null;
    }
};
export const getExhibitionById = async (id: number, lang: string = 'ru'): Promise<Exhibition | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getExhibitionById error:", e);
        return null;
    }
};
export const createExhibition = async (data: CreateExhibitionDto): Promise<Exhibition | null> => {
    try {
        const formData = new FormData();

        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('address', data.address);
        formData.append('date', data.date);
        formData.append('cost', data.cost);

        if (data.currency) {
            formData.append('currency', data.currency);
        }

        if (data.city_id) formData.append('city_id', String(data.city_id));
        if (data.country_id) formData.append('country_id', String(data.country_id));
        if (data.type_id) formData.append('type_id', String(data.type_id));
        if (data.genre_id) formData.append('genre_id', String(data.genre_id));
        if (data.owner_id) formData.append('owner_id', String(data.owner_id));

        if (data.image_path && data.image_path instanceof File) {
            formData.append('image_path', data.image_path);
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("createExhibition error:", e);
        return null;
    }
};
export const updateExhibition = async (id: number, data: UpdateExhibitionDto): Promise<Exhibition | null> => {
    try {
        const exhibitionDto = new FormData();
        if (data.title) exhibitionDto.append('title', data.title);
        if (data.description) exhibitionDto.append('description', data.description);
        if (data.address) exhibitionDto.append('address', data.address);
        if (data.date) exhibitionDto.append('date', data.date);
        if (data.cost) exhibitionDto.append('cost', data.cost);
        if (data.currency) exhibitionDto.append('currency', data.currency);
        if (data.city_id) exhibitionDto.append('city_id', String(data.city_id));
        if (data.country_id) exhibitionDto.append('country_id', String(data.country_id));
        if (data.type_id) exhibitionDto.append('type_id', String(data.type_id));
        if (data.genre_id) exhibitionDto.append('genre_id', String(data.genre_id));
        if (data.likes) exhibitionDto.append('likes', String(data.likes));
        if (data.image_path && data.image_path instanceof File) {
            exhibitionDto.append('image_path', data.image_path);
        }

        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: exhibitionDto,
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        return null;
    }
};
export const likeExhibition = async (id: number, currentLikes: number, action: 'increment' | 'decrement'): Promise<Exhibition | null> => {
    const newLikes = action === 'increment' ? currentLikes : Math.max(0, currentLikes - 1);
    return updateExhibition(id, { likes: newLikes });
};
export const deleteExhibition = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("deleteExhibition error:", e);
        return false;
    }
};
export const moderateExhibition = async (id: number, data: ModerateExhibitionDto): Promise<Exhibition | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("moderateExhibition error:", e);
        return null;
    }
};
export const getUnmoderatedExhibitions = async (page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<ExhibitionsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getUnmoderatedExhibitions error:", e);
        return null;
    }
};
export const getModeratedExhibitions = async (page: number = 1, limit: number = 12, lang: string = 'ru'): Promise<ExhibitionsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getModeratedExhibitions error:", e);
        return null;
    }
};
export const addArtToExhibition = async (exhibitionId: number, artId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/art/${artId}`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("addArtToExhibition error:", e);
        return false;
    }
};
export const removeArtFromExhibition = async (exhibitionId: number, artId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/art/${artId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("removeArtFromExhibition error:", e);
        return false;
    }
};
export const addArtistToExhibition = async (exhibitionId: number, artistId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/artist/${artistId}`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("addArtistToExhibition error:", e);
        return false;
    }
};
export const removeArtistFromExhibition = async (exhibitionId: number, artistId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/artist/${artistId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("removeArtistFromExhibition error:", e);
        return false;
    }
};
export const signUpToExhibition = async (exhibitionId: number, userId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/signup/${userId}`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || res.statusText);
        }

        return true;
    } catch (e) {
        console.log("signUpToExhibition error:", e);
        return false;
    }
};
export const cancelSignUp = async (exhibitionId: number, userId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/signup/${userId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("cancelSignUp error:", e);
        return false;
    }
};
export const checkSignUpStatus = async (exhibitionId: number, userId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/signup/${userId}/status`, {
            credentials: "include",
        });

        if (!res.ok) {
            return false;
        }

        const data = await res.json();
        return data.isSignedUp || false;
    } catch (e) {
        console.log("checkSignUpStatus error:", e);
        return false;
    }
};
export const getExhibitionsByOwner = async (ownerId: number, lang: string = 'ru'): Promise<Exhibition[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/owner/${ownerId}?lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getExhibitionsByOwner error:", e);
        return null;
    }
};
export const getExhibitionsByParticipant = async (artistId: number, lang: string = 'ru'): Promise<Exhibition[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/participant/${artistId}?lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getExhibitionsByParticipant error:", e);
        return null;
    }
};
export const getAllArtistExhibitions = async (artistId: number, lang: string = 'ru'): Promise<Exhibition[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}/all?lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getAllArtistExhibitions error:", e);
        return null;
    }
};
export const getUserRegisteredExhibitions = async (lang: string = 'ru'): Promise<Exhibition[]> => {
    try {
        const res = await fetch(`${BASE_URL}/user/registered?lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.log("getUserRegisteredExhibitions error:", e);
        return [];
    }
};
export const checkUserRegistration = async (exhibitionId: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/check-registration`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data === true || data === 'true';
    } catch (e) {
        console.log("checkUserRegistration error:", e);
        return false;
    }
};
export const getRegisteredCount = async (exhibitionId: number): Promise<number> => {
    try {
        const res = await fetch(`${BASE_URL}/${exhibitionId}/registered-count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.log("getRegisteredCount error:", e);
        return 0;
    }
};