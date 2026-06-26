export type BaseUserData = {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name: string;
    phone_number: string;
    avatar_path?: File | null;
}

export type RegisterUserData = BaseUserData & {
    role: "user";
}

export type RegisterArtistData = BaseUserData & {
    date_birthday?: Date | null;
    biography?: string | null;
    city_id?: number | null;
    country_id?: number | null;
    moderate?: false;
    role?: "artist";
}

export type FormDataType = RegisterUserData | RegisterArtistData;

// hooks/useRegisterForm.ts
import { useState, useCallback } from "react";
import { validateEmail, validatePassword, validateText } from "../../../../validators/auth.validators";

export const useRegisterForm = (isArtist: boolean) => {
    const [formData, setFormData] = useState<FormDataType>(() => {
        const baseData = {
            email: "",
            password: "",
            name: "",
            surname: "",
            second_name: "",
            phone_number: "",
            avatar_path: null,
        };

        if (isArtist) {
            return {
                ...baseData,
                date_birthday: null,
                biography: null,
                city_id: null,
                country_id: null,
                moderate: false,
            } as RegisterArtistData;
        }

        return { ...baseData, role: "user" } as RegisterUserData;
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
        second_name: "",
        name: "",
        phone_number: "",
        ...(isArtist && { date_birthday: "", city: "", country: "" })
    });

    const validateField = useCallback((name: string, value: string) => {
        switch (name) {
            case "email": return validateEmail(value);
            case "password": return validatePassword(value);
            case "second_name":
            case "name":
            case "surname":
                return validateText(value);
            default: return "";
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        setFormData(prev => {
            if (isArtist && (name === 'biography' || name === 'date_birthday' || name === 'city_id' || name === 'country_id')) {
                return { ...prev, [name]: value } as RegisterArtistData;
            }
            return { ...prev, [name]: value };
        });
    }, [validateField, isArtist]);

    const validateForm = useCallback(() => {
        const baseErrors = {
            email: validateEmail(formData.email),
            password: validatePassword(formData.password),
            second_name: validateText(formData.second_name),
            name: validateText(formData.name),
            phone_number: formData.phone_number ? "" : "Телефон обязателен",
        };
        const artistErrors = isArtist ? {
            date_birthday: (formData as RegisterArtistData).date_birthday ? "" : "Дата рождения обязательна"
        } : {};

        const formErrors = { ...baseErrors, ...artistErrors };
        setErrors(prev => ({ ...prev, ...formErrors }));

        return !Object.values(formErrors).some(error => error !== "");
    }, [formData, isArtist]);

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        handleInputChange,
        validateForm,
    };
};