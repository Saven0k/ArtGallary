interface LikedItem {
    id: number;
    title: string;
    type: 'art' | 'exhibition' | 'artist';
    likedAt: number;
}

interface GuestData {
    isGuest: boolean;
    guestId: string;
    likedItems: LikedItem[];
    createdAt: number;
}

class GuestStorageService {
    private readonly STORAGE_KEY = 'guest_data';

    isGuest(): boolean {
        const data = this.getGuestData();
        return data?.isGuest || false;
    }

    getGuestData(): GuestData | null {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    initGuest(): void {
        const existingData = this.getGuestData();

        if (existingData?.isGuest) return;

        const guestData: GuestData = {
            isGuest: true, guestId: 'guest_' + Date.now() + '_' + Math.random().toString(36), likedItems: [], createdAt: Date.now()
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(guestData));
    }


    addLike(id: number, title: string, type: LikedItem['type']): void {
        const data = this.getGuestData();

        if (!data || !data.isGuest) return;

        const alreadyLiked = data.likedItems.some(item => item.id === id && item.type === type);

        if (alreadyLiked) return;

        const newLike: LikedItem = { id, title, type, likedAt: Date.now() };

        data.likedItems.push(newLike);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    removeLike(id: number, type: LikedItem['type']): void {
        const data = this.getGuestData();

        if (!data || !data.isGuest) return;

        const initialLength = data.likedItems.length;
        data.likedItems = data.likedItems.filter(item => !(item.id === id && item.type === type));

        if (initialLength !== data.likedItems.length) localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    }

    isLiked(id: number, type: LikedItem['type']): boolean {
        const data = this.getGuestData();

        if (!data || !data.isGuest) return false;

        return data.likedItems.some(item => item.id === id && item.type === type);
    }

    getAllLikes(): LikedItem[] {
        const data = this.getGuestData();
        if (!data || !data.isGuest) return [];
        return data.likedItems;
    }

    getLikesByType(type: LikedItem['type']): LikedItem[] {
        const data = this.getGuestData();
        if (!data || !data.isGuest) return [];
        return data.likedItems.filter(item => item.type === type);
    }

    getLikesCount(): number {
        const data = this.getGuestData();
        return data?.likedItems.length || 0;
    }

    getGuestId(): string | null {
        const data = this.getGuestData();
        return data?.guestId || null;
    }

    clearAllLikes(): void {
        const data = this.getGuestData();
        if (!data || !data.isGuest) return;
        data.likedItems = [];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    clearAllData(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    clearGuest(): void {
        this.clearAllData();
    }
}

export const guestStorage = new GuestStorageService();