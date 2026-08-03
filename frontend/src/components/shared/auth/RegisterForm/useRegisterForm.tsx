// hooks/useRegisterForm.ts
import { useState, useCallback } from "react";
import { validateEmail, validatePassword, validateText } from "../../../../validators/auth.validators";

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
    gender?: "M" | "F";
    city_id?: number | null;
    country_id?: number | null;
}

export type RegisterArtistData = BaseUserData & {
    date_birthday?: Date | null;
    biography?: string | null;
    city_id?: number | null;
    country_id?: number | null;
    moderate?: false;
    role?: "artist";
    gender?: "M" | "F";
}

export type FormDataType = RegisterUserData | RegisterArtistData;

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
            gender: "M" as "M" | "F",
        };

        if (isArtist) {
            return {
                ...baseData,
                date_birthday: null,
                biography: null,
                city_id: null,
                country_id: null,
                moderate: false,
                role: "artist",
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
        gender: "",
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
            case "gender":
                return (value === "M" || value === "F") ? "" : "Выберите пол";
            default: return "";
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        setFormData(prev => {
            if (name === 'gender') {
                return { ...prev, gender: value as "M" | "F" };
            }
            if (isArtist && (name === 'biography' || name === 'date_birthday' || name === 'city_id' || name === 'country_id')) {
                return { ...prev, [name]: value as any } as RegisterArtistData;
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
            gender: (formData.gender === "M" || formData.gender === "F") ? "" : "Выберите пол",
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
