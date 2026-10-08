import { useContext } from 'react';
import { GalleryContext } from '../context/GalleryContext';

export const useLikes = () => {
    const context = useContext(GalleryContext);
    if (!context) throw new Error('GalleryProvider is required');
    return {
        likedArts: context.likedArts,
        likedAuthors: context.likedAuthors,
        loading: context.loading,
        reload: context.reload,
        toggleLikeArt: context.toggleLikeArt,
        toggleLikeAuthor: context.toggleLikeAuthor,
        isArtLiked: (id: number) => context.likedArts.includes(id),
        isAuthorLiked: (id: number) => context.likedAuthors.includes(id),
        getLikedArts: () => context.likedArts,
        getLikedAuthors: () => context.likedAuthors,
    };
};
