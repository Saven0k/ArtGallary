import { memo } from "react";
import { RegisterForm } from "../../components/shared/auth/RegisterForm/RegisterForm";

const RegisterPage = memo(() => {
    return (
        <div className="page">
            <RegisterForm />
        </div>
    )
})

export default RegisterPage;