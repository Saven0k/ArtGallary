// src/components/shared/auth/LoginForm/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const loginFormTranslations = {
    ru: {
        loginForm: {
            title: "Вход",
            subtitle: "Войдите в свой аккаунт",
            fields: {
                email: "Email",
                password: "Пароль"
            },
            buttons: {
                login: "Войти",
                loading: "Загрузка..."
            },
            footer: {
                text: "Нет аккаунта?",
                link: "Зарегистрироваться"
            },
            errors: {
                invalidCredentials: "Неверный email или пароль",
                serverError: "Ошибка сервера. Попробуйте позже",
                emailRequired: "Введите email",
                codeRequired: "Введите код из письма",
                passwordRequired: "Введите новый пароль",
                passwordMin: "Пароль должен содержать минимум 6 символов",
                passwordMismatch: "Пароли не совпадают"
            },
            reset: {
                forgotPassword: "Забыли пароль?",
                title: "Восстановление пароля",
                subtitle: "Мы отправим код на вашу почту",
                instruction: "Введите email, на который мы отправим код для восстановления пароля",
                sendCode: "Отправить код",
                editEmail: "Изменить email",
                backToLogin: "Вернуться ко входу",
                backToCode: "Назад к коду",
                success: "Код отправлен на вашу почту!",
                error: "Пользователь с таким email не найден",
                enterCode: "Ввести код",
                enterCodeInstruction: "Введите код из письма",
                codeLabel: "Код из письма",
                codePlaceholder: "Введите 6-значный код",
                newPasswordTitle: "Новый пароль",
                enterNewPassword: "Придумайте новый пароль",
                confirmPassword: "Подтверждение пароля",
                changePassword: "Изменить пароль",
                passwordChanged: "✅ Пароль успешно изменен! Сейчас вы будете перенаправлены на вход",
                invalidCode: "❌ Неверный код или код истек"
            }
        }
    },
    en: {
        loginForm: {
            title: "Login",
            subtitle: "Sign in to your account",
            fields: {
                email: "Email",
                password: "Password"
            },
            buttons: {
                login: "Login",
                loading: "Loading..."
            },
            footer: {
                text: "Don't have an account?",
                link: "Sign up"
            },
            errors: {
                invalidCredentials: "Invalid email or password",
                serverError: "Server error. Please try again later",
                emailRequired: "Please enter your email",
                codeRequired: "Please enter the code",
                passwordRequired: "Please enter a new password",
                passwordMin: "Password must be at least 6 characters",
                passwordMismatch: "Passwords do not match"
            },
            reset: {
                forgotPassword: "Forgot password?",
                title: "Reset Password",
                subtitle: "We'll send a code to your email",
                instruction: "Enter your email and we'll send you a code to reset your password",
                sendCode: "Send Code",
                editEmail: "Change email",
                backToLogin: "Back to login",
                backToCode: "Back to code",
                success: "Code sent to your email!",
                error: "User with this email not found",
                enterCode: "Enter code",
                enterCodeInstruction: "Enter the code from your email",
                codeLabel: "Code from email",
                codePlaceholder: "Enter 6-digit code",
                newPasswordTitle: "New Password",
                enterNewPassword: "Create a new password",
                confirmPassword: "Confirm Password",
                changePassword: "Change Password",
                passwordChanged: "✅ Password changed successfully! You will be redirected to login",
                invalidCode: "❌ Invalid code or code expired"
            }
        }
    },
    zh: {
        loginForm: {
            title: "登录",
            subtitle: "登录您的账户",
            fields: {
                email: "电子邮箱",
                password: "密码"
            },
            buttons: {
                login: "登录",
                loading: "加载中..."
            },
            footer: {
                text: "没有账户？",
                link: "注册"
            },
            errors: {
                invalidCredentials: "邮箱或密码错误",
                serverError: "服务器错误，请稍后重试",
                emailRequired: "请输入邮箱",
                codeRequired: "请输入验证码",
                passwordRequired: "请输入新密码",
                passwordMin: "密码至少需要6个字符",
                passwordMismatch: "密码不匹配"
            },
            reset: {
                forgotPassword: "忘记密码？",
                title: "重置密码",
                subtitle: "我们将向您的邮箱发送验证码",
                instruction: "输入您的邮箱，我们将向您发送重置密码的验证码",
                sendCode: "发送验证码",
                editEmail: "修改邮箱",
                backToLogin: "返回登录",
                backToCode: "返回验证码",
                success: "验证码已发送到您的邮箱！",
                error: "未找到使用该邮箱的用户",
                enterCode: "输入验证码",
                enterCodeInstruction: "输入邮件中的验证码",
                codeLabel: "邮件验证码",
                codePlaceholder: "输入6位验证码",
                newPasswordTitle: "新密码",
                enterNewPassword: "创建新密码",
                confirmPassword: "确认密码",
                changePassword: "修改密码",
                passwordChanged: "✅ 密码修改成功！即将跳转到登录页面",
                invalidCode: "❌ 验证码无效或已过期"
            }
        }
    }
};