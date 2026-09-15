// src/components/Likes/HeartIcon.tsx
interface HeartIconProps {
    filled?: boolean;
    size?: number;
}

export const HeartIcon = ({ filled = false, size = 22 }: HeartIconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? '#e53935' : 'none'}
        stroke={filled ? '#e53935' : '#888'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);