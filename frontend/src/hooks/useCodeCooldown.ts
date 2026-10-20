import { useEffect, useState } from 'react';

export const useCodeCooldown = () => {
    const [remaining, setRemaining] = useState(0);
    useEffect(() => {
        if (remaining <= 0) return;
        const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [remaining]);
    return [remaining, () => setRemaining(60)] as const;
};
