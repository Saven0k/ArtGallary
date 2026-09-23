// src/pages/Register/components/lang.ts

export const registerAuthorTranslations = {
    ru: {
        registerAuthor: {
            title: "Регистрация автора",
            step1: {
                title: "Личная информация",
                fields: {
                    surname: "Фамилия",
                    name: "Имя",
                    secondName: "Отчество",
                    birthday: "Дата рождения"
                }
            },
            step2: {
                title: "Данные для входа",
                fields: {
                    email: "Email",
                    password: "Пароль",
                    confirmPassword: "Подтверждение пароля",
                    gender: "Пол"
                },
                options: {
                    male: "Мужской",
                    female: "Женский"
                }
            },
            step3: {
                title: "Фотография профиля",
                uploadText: "Выберите фото профиля",
                uploadHint: "Перетащите изображения сюда в формате PNG до 10 МБ",
                uploadBtn: "Выбрать изображение",
                changeBtn: "Изменить"
            },
            step4: {
                title: "Местоположение и профессия",
                fields: {
                    country: "Страна",
                    city: "Город",
                    profession: "Профессия"
                }
            },
            step5: {
                title: "О себе",
                fields: {
                    biography: "Расскажите о себе, вашем творческом пути и опыте"
                }
            },
            buttons: {
                back: "Назад",
                next: "Далее",
                submit: "Зарегистрироваться",
                loading: "Загрузка..."
            },
            footer: {
                text: "Уже есть аккаунт?",
                link: "Войти"
            },
            errors: {
                required: "Поле обязательно для заполнения",
                email: "Введите корректный email (example@mail.com)",
                passwordMin: "Пароль должен содержать минимум 8 символов",
                passwordMax: "Пароль не должен превышать 25 символов",
                passwordMismatch: "Пароли не совпадают",
                minLength: "Минимальная длина {min} символа",
                emailExists: "Пользователь с таким email уже существует",
                registerFailed: "Ошибка при регистрации. Попробуйте позже"
            },
            agreement: {
                text: "Я согласен с",
                rulesLink: "правилами магазина и оферты",
                error: "Необходимо принять условия",
            },
        }
    },
    en: {
        registerAuthor: {
            title: "Author Registration",
            step1: {
                title: "Personal Information",
                fields: {
                    surname: "Surname",
                    name: "First Name",
                    secondName: "Middle Name",
                    birthday: "Date of Birth"
                }
            },
            step2: {
                title: "Login Details",
                fields: {
                    email: "Email",
                    password: "Password",
                    confirmPassword: "Confirm Password",
                    gender: "Gender"
                },
                options: {
                    male: "Male",
                    female: "Female"
                }
            },
            step3: {
                title: "Profile Photo",
                uploadText: "Choose profile photo",
                uploadHint: "Drag and drop images here in PNG format up to 10 MB",
                uploadBtn: "Choose image",
                changeBtn: "Change"
            },
            step4: {
                title: "Location and Profession",
                fields: {
                    country: "Country",
                    city: "City",
                    profession: "Profession"
                }
            },
            step5: {
                title: "About You",
                fields: {
                    biography: "Tell us about yourself, your creative journey and experience"
                }
            },
            buttons: {
                back: "Back",
                next: "Next",
                submit: "Register",
                loading: "Loading..."
            },
            footer: {
                text: "Already have an account?",
                link: "Login"
            },
            errors: {
                required: "This field is required",
                email: "Please enter a valid email (example@mail.com)",
                passwordMin: "Password must be at least 8 characters",
                passwordMax: "Password must not exceed 25 characters",
                passwordMismatch: "Passwords do not match",
                minLength: "Minimum length {min} characters",
                emailExists: "User with this email already exists",
                registerFailed: "Registration failed. Please try again later"
            },
            agreement: {
                text: "I agree to the",
                rulesLink: "store rules and terms of service",
                error: "You must accept the terms",
            },
        }
    },
    zh: {
        registerAuthor: {
            title: "作者注册",
            step1: {
                title: "个人信息",
                fields: {
                    surname: "姓",
                    name: "名",
                    secondName: "中间名",
                    birthday: "出生日期"
                }
            },
            step2: {
                title: "登录信息",
                fields: {
                    email: "电子邮箱",
                    password: "密码",
                    confirmPassword: "确认密码",
                    gender: "性别"
                },
                options: {
                    male: "男",
                    female: "女"
                }
            },
            step3: {
                title: "个人资料照片",
                uploadText: "选择个人资料照片",
                uploadHint: "将PNG格式图片拖放到此处，最大10MB",
                uploadBtn: "选择图片",
                changeBtn: "更改"
            },
            step4: {
                title: "位置和职业",
                fields: {
                    country: "国家",
                    city: "城市",
                    profession: "职业"
                }
            },
            step5: {
                title: "关于您",
                fields: {
                    biography: "请告诉我们关于您自己、您的创作历程和经验"
                }
            },
            buttons: {
                back: "返回",
                next: "下一步",
                submit: "注册",
                loading: "加载中..."
            },
            footer: {
                text: "已有账户？",
                link: "登录"
            },
            errors: {
                required: "此字段为必填项",
                email: "请输入有效的电子邮箱 (example@mail.com)",
                passwordMin: "密码至少需要8个字符",
                passwordMax: "密码不能超过25个字符",
                passwordMismatch: "密码不匹配",
                minLength: "最小长度 {min} 个字符",
                emailExists: "该邮箱已被注册",
                registerFailed: "注册失败，请稍后重试"
            },
            agreement: {
                text: "我同意",
                rulesLink: "商店规则和服务条款",
                error: "请先同意条款",
            },
        }
    }
};

// Переводы для RegisterUser (3 шага)
export const registerUserTranslations = {
    ru: {
        registerUser: {
            title: "Регистрация",
            step1: {
                title: "Личная информация",
                fields: {
                    surname: "Фамилия",
                    name: "Имя",
                    secondName: "Отчество",
                    birthday: "Дата рождения"
                }
            },
            step2: {
                title: "Данные для входа",
                fields: {
                    email: "Email",
                    password: "Пароль",
                    confirmPassword: "Подтверждение пароля",
                    gender: "Пол"
                },
                options: {
                    male: "Мужской",
                    female: "Женский"
                }
            },
            step3: {
                title: "Местоположение",
                fields: {
                    country: "Страна",
                    city: "Город"
                }
            },
            buttons: {
                back: "Назад",
                next: "Далее",
                submit: "Зарегистрироваться",
                loading: "Загрузка..."
            },
            footer: {
                text: "Уже есть аккаунт?",
                link: "Войти"
            },
            errors: {
                required: "Поле обязательно для заполнения",
                email: "Введите корректный email (example@mail.com)",
                passwordMin: "Пароль должен содержать минимум 8 символов",
                passwordMax: "Пароль не должен превышать 25 символов",
                passwordMismatch: "Пароли не совпадают",
                minLength: "Минимальная длина {min} символа",
                emailExists: "Пользователь с таким email уже существует",
                registerFailed: "Ошибка при регистрации. Попробуйте позже"
            },
            agreement: {
                text: "Я согласен с",
                rulesLink: "правилами магазина и оферты",
                error: "Необходимо принять условия",
            },
        }
    },
    en: {
        registerUser: {
            title: "Registration",
            step1: {
                title: "Personal Information",
                fields: {
                    surname: "Surname",
                    name: "First Name",
                    secondName: "Middle Name",
                    birthday: "Date of Birth"
                }
            },
            step2: {
                title: "Login Details",
                fields: {
                    email: "Email",
                    password: "Password",
                    confirmPassword: "Confirm Password",
                    gender: "Gender"
                },
                options: {
                    male: "Male",
                    female: "Female"
                }
            },
            step3: {
                title: "Location",
                fields: {
                    country: "Country",
                    city: "City"
                }
            },
            buttons: {
                back: "Back",
                next: "Next",
                submit: "Register",
                loading: "Loading..."
            },
            footer: {
                text: "Already have an account?",
                link: "Login"
            },
            errors: {
                required: "This field is required",
                email: "Please enter a valid email (example@mail.com)",
                passwordMin: "Password must be at least 8 characters",
                passwordMax: "Password must not exceed 25 characters",
                passwordMismatch: "Passwords do not match",
                minLength: "Minimum length {min} characters",
                emailExists: "User with this email already exists",
                registerFailed: "Registration failed. Please try again later"
            },
            agreement: {
                text: "I agree to the",
                rulesLink: "store rules and terms of service",
                error: "You must accept the terms",
            },
        }
    },
    zh: {
        registerUser: {
            title: "注册",
            step1: {
                title: "个人信息",
                fields: {
                    surname: "姓",
                    name: "名",
                    secondName: "中间名",
                    birthday: "出生日期"
                }
            },
            step2: {
                title: "登录信息",
                fields: {
                    email: "电子邮箱",
                    password: "密码",
                    confirmPassword: "确认密码",
                    gender: "性别"
                },
                options: {
                    male: "男",
                    female: "女"
                }
            },
            step3: {
                title: "位置",
                fields: {
                    country: "国家",
                    city: "城市"
                }
            },
            buttons: {
                back: "返回",
                next: "下一步",
                submit: "注册",
                loading: "加载中..."
            },
            footer: {
                text: "已有账户？",
                link: "登录"
            },
            errors: {
                required: "此字段为必填项",
                email: "请输入有效的电子邮箱 (example@mail.com)",
                passwordMin: "密码至少需要8个字符",
                passwordMax: "密码不能超过25个字符",
                passwordMismatch: "密码不匹配",
                minLength: "最小长度 {min} 个字符",
                emailExists: "该邮箱已被注册",
                registerFailed: "注册失败，请稍后重试"
            },
            agreement: {
                text: "我同意",
                rulesLink: "商店规则和服务条款",
                error: "请先同意条款",
            },
        }
    }
};