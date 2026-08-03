import { useContext } from "react";
import type { UserRole } from "../api/users/main.api";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("AuthContext not available");
    const hasRole = (roles: Array<UserRole | 'visitor'>) => {
        if (!ctx.user) return false;
        return roles.includes(ctx.user.role);
    };
    
    const isAdmin = () => ctx.user?.role === 'admin';
    const isModerator = () => ctx.user?.role === 'moderator';
    const isArtist = () => ctx.user?.role === 'artist';
    const isVisitor = () => false;
    const isUser = () => ctx.user?.role === 'user';
    
    return {
        ...ctx,
        hasRole,
        isAdmin,
        isModerator,
        isArtist,
        isVisitor,
        isUser,
    };
}