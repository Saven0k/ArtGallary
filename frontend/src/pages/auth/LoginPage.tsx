import { memo } from "react";
import { AuthForm } from "../../components/shared/auth/AuthForm/AuthForm";
// import "../assets/LoginPage.css";

const LoginPage = memo(() => {
    return (
        <div className="page">
            <AuthForm />
        </div>
    );
})

export default LoginPage;