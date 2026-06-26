import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoutes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    if (!user) navigate('/');
    return;
}