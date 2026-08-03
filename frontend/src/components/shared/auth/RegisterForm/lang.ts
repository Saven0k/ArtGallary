// components/forms/lang.ts
export const registerFormTranslations = {
    ru: {
        title: {
            user: "Регистрация",
            artist: "Регистрация артиста"
        },
        commonFields: {
            email: "Email",
            password: "Пароль",
            surname: "Фамилия",
            name: "Имя",
            second_name: "Отчество",
            phone_number: "Номер телефона",
            gender: "Пол", 
            male: "Мужской", 
            female: "Женский", 
        },
        artistFields: {
            avatar: "Фотография профиля",
            changePhoto: "Изменить фото",
            selectPhoto: "Выберите фото профиля",
            birthday: "Дата рождения",
            location: "Местоположение",
            country: "Страна",
            city: "Город",
            biography: "Биография",
            biographyPlaceholder: "Расскажите о себе...",
            selectCountry: "Выберите страну",
            selectCity: "Выберите город"
        },
        buttons: {
            register: "Зарегистрироваться",
            registerAsUser: "Зарегистрироваться как обычный пользователь",
            registerAsArtist: "Зарегистрироваться как художник"
        },
        links: {
            login: "Войти"
        },
        validation: {
            phoneRequired: "Телефон обязателен",
            birthdayRequired: "Дата рождения обязательна"
        }
    },
    en: {
        title: {
            user: "Sign Up",
            artist: "Artist Sign Up"
        },
        commonFields: {
            email: "Email",
            password: "Password",
            surname: "Last Name",
            name: "First Name",
            second_name: "Middle Name",
            phone_number: "Phone Number",
            gender: "Gender",
            male: "Male",
            female: "Female", 
        },
        artistFields: {
            avatar: "Profile Photo",
            changePhoto: "Change photo",
            selectPhoto: "Select profile photo",
            birthday: "Date of Birth",
            location: "Location",
            country: "Country",
            city: "City",
            biography: "Biography",
            biographyPlaceholder: "Tell us about yourself...",
            selectCountry: "Select country",
            selectCity: "Select city"
        },
        buttons: {
            register: "Sign Up",
            registerAsUser: "Sign up as regular user",
            registerAsArtist: "Sign up as artist"
        },
        links: {
            login: "Login"
        },
        validation: {
            phoneRequired: "Phone number is required",
            birthdayRequired: "Date of birth is required"
        }
    }
};