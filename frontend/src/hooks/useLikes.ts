import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const LIKED_ARTS_KEY = 'liked_arts';
const LIKED_AUTHORS_KEY = 'liked_authors';

export const useLikes = () => {
    const { isAuthenticated } = useAuth();
    const [likedArts, setLikedArts] = useState<number[]>([]);
    const [likedAuthors, setLikedAuthors] = useState<number[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            const storedArts = localStorage.getItem(LIKED_ARTS_KEY);
            const storedAuthors = localStorage.getItem(LIKED_AUTHORS_KEY);
            
            if (storedArts) {
                try { setLikedArts(JSON.parse(storedArts)); } catch { setLikedArts([]); }
            }
            if (storedAuthors) {
                try { setLikedAuthors(JSON.parse(storedAuthors)); } catch { setLikedAuthors([]); }
            }
        }
    }, [isAuthenticated]);

    const toggleLikeArt = (artId: number) => {
        if (isAuthenticated) {
            // TODO: API запрос на лайк/дизлайк картины на сервере
            console.log("Authenticated - toggle like art API:", artId);
            // Здесь будет запрос на сервер
            return;
        }

        // Не авторизован - сохраняем в localStorage
        const isLiked = likedArts.includes(artId);
        const updated = isLiked 
            ? likedArts.filter(id => id !== artId)
            : [...likedArts, artId];
        
        setLikedArts(updated);
        localStorage.setItem(LIKED_ARTS_KEY, JSON.stringify(updated));
        console.log(`${isLiked ? 'Unliked' : 'Liked'} art (local):`, artId);
    };

    const toggleLikeAuthor = (authorId: number) => {
        if (isAuthenticated) {
            // TODO: API запрос на лайк/дизлайк автора на сервере
            console.log("Authenticated - toggle like author API:", authorId);
            return;
        }

        const isLiked = likedAuthors.includes(authorId);
        const updated = isLiked 
            ? likedAuthors.filter(id => id !== authorId)
            : [...likedAuthors, authorId];
        
        setLikedAuthors(updated);
        localStorage.setItem(LIKED_AUTHORS_KEY, JSON.stringify(updated));
        console.log(`${isLiked ? 'Unliked' : 'Liked'} author (local):`, authorId);
    };

    const isArtLiked = (artId: number): boolean => {
        return likedArts.includes(artId);
    };

    const isAuthorLiked = (authorId: number): boolean => {
        return likedAuthors.includes(authorId);
    };

    const getLikedArts = (): number[] => likedArts;
    const getLikedAuthors = (): number[] => likedAuthors;

    return {
        likedArts,
        likedAuthors,
        toggleLikeArt,
        toggleLikeAuthor,
        isArtLiked,
        isAuthorLiked,
        getLikedArts,
        getLikedAuthors,
    };
};