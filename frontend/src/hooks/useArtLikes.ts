import { useState, useEffect, useCallback, useRef } from 'react';
import { likeArt } from '../api/arts/main.api';
import { useNotification } from '../context/NotificationContext';

const LIKED_ARTS_KEY = 'liked_arts';

// Получить список понравившихся картин из localStorage
const getLikedArtsFromStorage = (): number[] => {
    try {
        const stored = localStorage.getItem(LIKED_ARTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Сохранить список понравившихся картин в localStorage
const saveLikedArtsToStorage = (likedArts: number[]) => {
    localStorage.setItem(LIKED_ARTS_KEY, JSON.stringify(likedArts));
};

// Добавить ID в localStorage
const addLikedArtToStorage = (artId: number) => {
    const likedArts = getLikedArtsFromStorage();
    if (!likedArts.includes(artId)) {
        saveLikedArtsToStorage([...likedArts, artId]);
    }
};

// Удалить ID из localStorage
const removeLikedArtFromStorage = (artId: number) => {
    const likedArts = getLikedArtsFromStorage();
    const updatedLikedArts = likedArts.filter(id => id !== artId);
    saveLikedArtsToStorage(updatedLikedArts);
};

export const useArtLikes = (artId: number, initialLikes: number = 0) => {
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const isProcessingRef = useRef(false);

    // Синхронизируем likesCount с initialLikes (когда данные загружаются с сервера)
    useEffect(() => {
        setLikesCount(initialLikes);
    }, [initialLikes]);

    // Проверяем при монтировании, лайкнута ли картина
    useEffect(() => {
        const likedArts = getLikedArtsFromStorage();
        const liked = likedArts.includes(artId);
        setIsLiked(liked);
    }, [artId]);

    const handleLike = useCallback(async () => {
        if (loading || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setLoading(true);

        const previousLiked = isLiked;
        const previousCount = likesCount;

        const newIsLiked = !isLiked;
        const newCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

        setLikesCount(newCount);
        setIsLiked(newIsLiked);

        if (newIsLiked) {
            addLikedArtToStorage(artId);
        } else {
            removeLikedArtFromStorage(artId);
        }

        try {
            const action = newIsLiked ? 'increment' : 'decrement';
            // ВАЖНО: передаем current likesCount (новое значение)
            const updatedArt = await likeArt(artId, newCount, action);

            if (updatedArt && updatedArt.likes !== undefined) {
                setLikesCount(updatedArt.likes);

                if (newIsLiked) {
                    showNotification("❤️ Спасибо за вашу оценку!", "success");
                } else {
                    showNotification("💔 Лайк удален", "success");
                }
            } else {
                throw new Error('Failed to update likes');
            }
        } catch (error) {
            setLikesCount(previousCount);
            setIsLiked(previousLiked);

            if (previousLiked) {
                addLikedArtToStorage(artId);
            } else {
                removeLikedArtFromStorage(artId);
            }

            showNotification("Ошибка при обновлении лайка", "error");
            console.error('Like error:', error);
        } finally {
            setLoading(false);
            isProcessingRef.current = false;
        }
    }, [artId, likesCount, isLiked, loading, showNotification]);

    return {
        likesCount,
        isLiked,
        loading,
        handleLike
    };
};