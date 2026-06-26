const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const TEXT_REGEX = /^[A-ZА-ЯЁ][a-zа-яё]*$/

export const validateEmail = (email: string): string => {
    if (!email.trim()) return "Обязательное поле";
    if (!EMAIL_REGEX.test(email)) return "Email не валиден";
    return "";
};

export const validatePassword = (password: string): string => {
    if (!password.trim()) return "Обязательное поле";
    return "";
};


export const validateText = (text: string): string => {
    if (!text.trim()) return "Обязательное поле"
    if (!TEXT_REGEX.test(text)) return "Только буквы, первая заглавная"
    return "";
}

export interface AuthFormErrors {
    email: string;
    password: string;
}

export const validateAuthForm = (
    email: string,
    password: string
): AuthFormErrors => ({
    email: validateEmail(email),
    password: validatePassword(password),
});

export interface RegisterFormErrors {
    email: string,
    password: string,
    second_name: string,
    name: string
}

export const validateRegisterForm = (
    email: string,
    password: string,
    second_name: string,
    name: string
): RegisterFormErrors => ({
    email: validateEmail(email),
    password: validatePassword(password),
    second_name: validateText(second_name),
    name: validateText(name),
})