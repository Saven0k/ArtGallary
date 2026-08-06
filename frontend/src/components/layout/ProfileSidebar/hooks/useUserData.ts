import { useState, useEffect } from 'react';
import { getUserProfile, type User } from '../../../../api/users/main.api';
import { getAuthorById } from '../../../../api/authors/main.api';

interface UserData {
    name: string;
    surname: string;
    avatar_path: string;
}

export const useUserData = (user: User | null) => {
    const [userData, setUserData] = useState<UserData>({
        name: '',
        surname: '',
        avatar_path: ''
    });
    const [isModerated, setIsModerated] = useState<boolean | null>(null);

    useEffect(() => {
        // const fetchData = async () => {
        //     if (!user) return;

        //     try {
        //         const data = await getUserProfile(user.id);
        //         setUserData(data);

        //         if (user.role === 'artist') {
        //             const artistData = await getAuthorById(user.id);
        //             const moderate = artistData?.artistProfile?.moderate as any;
        //             setIsModerated(moderate?.moderate === true);
        //         }
        //     } catch (error) {
        //         console.error('Error fetching user data:', error);
        //         setIsModerated(false);
        //     }
        // };

        // fetchData();
    }, [user]);

    return { userData, isModerated };
};