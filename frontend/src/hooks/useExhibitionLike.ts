import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';

const LIKED_EXHIBITIONS_KEY = 'liked_exhibitions';

// Получить список понравившихся выставок из localStorage
const getLikedExhibitionsFromStorage = (): number[] => {
    try {
        const stored = localStorage.getItem(LIKED_EXHIBITIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Сохранить список понравившихся выставок в localStorage
const saveLikedExhibitionsToStorage = (likedExhibitions: number[]) => {
    localStorage.setItem(LIKED_EXHIBITIONS_KEY, JSON.stringify(likedExhibitions));
};

// Добавить ID в понравившиеся
const addLikedExhibitionToStorage = (exhibitionId: number) => {
    const likedExhibitions = getLikedExhibitionsFromStorage();
    if (!likedExhibitions.includes(exhibitionId)) {
        saveLikedExhibitionsToStorage([...likedExhibitions, exhibitionId]);
    }
};

// Удалить ID из понравившихся
const removeLikedExhibitionFromStorage = (exhibitionId: number) => {
    const likedExhibitions = getLikedExhibitionsFromStorage();
    const updatedLikedExhibitions = likedExhibitions.filter(id => id !== exhibitionId);
    saveLikedExhibitionsToStorage(updatedLikedExhibitions);
};

export const useExhibitionLike = (exhibitionId: number) => {
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const isProcessingRef = useRef(false);

    // Проверяем при монтировании, понравилась ли выставка
    useEffect(() => {
        const likedExhibitions = getLikedExhibitionsFromStorage();
        const isLikedExhibition = likedExhibitions.includes(exhibitionId);
        setIsLiked(isLikedExhibition);
    }, [exhibitionId]);

    const toggleLike = useCallback(async () => {
        if (loading || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setLoading(true);

        const previousLiked = isLiked;
        const newIsLiked = !isLiked;

        // Оптимистичное обновление UI
        setIsLiked(newIsLiked);

        try {
            if (newIsLiked) {
                addLikedExhibitionToStorage(exhibitionId);
                showNotification("❤️ Выставка добавлена в понравившиеся!", "success");
            } else {
                removeLikedExhibitionFromStorage(exhibitionId);
                showNotification("💔 Выставка удалена из понравившихся", "success");
            }
        } catch (error) {
            // Откат при ошибке
            setIsLiked(previousLiked);
            showNotification("Ошибка при обновлении", "error");
            console.error('Like error:', error);
        } finally {
            setLoading(false);
            isProcessingRef.current = false;
        }
    }, [exhibitionId, isLiked, loading, showNotification]);

    return {
        isLiked,
        loading,
        toggleLike
    };
};