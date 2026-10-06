export type Language = "ru" | "en" | "zh";

export interface PersonalInfoTranslations {
    title: string;
    subtitle: string;
    fields: {
        name: string;
        surname: string;
        secondName: string;
        birthday: string;
        country: string;
        city: string;
        email: string;
        about: string;
        profession: string;
    };
    placeholders: {
        name: string;
        surname: string;
        secondName: string;
        email: string;
        about: string;
    };
    common: {
        loading: string;
        saving: string;
        selectCountryFirst: string;
        errorLoading: string;
        errorSaving: string;
    };
    emailHint: string;
    button: string;
    avatar: {
        label: string;
        upload: string;
        change: string;
        remove: string;
        cropTitle: string;
        cropConfirm: string;
        cropCancel: string;
        hint: string;
        saved: string;
        saveError: string;
        errors: {
            format: string;
            size: string;
            read: string;
        };
    };
}

export const personalInfoTranslations: Record<Language, PersonalInfoTranslations> = {
    ru: {
        title: "Личная информация",
        subtitle: "Обновите информацию о своём профиле",
        fields: {
            name: "Имя",
            surname: "Фамилия",
            secondName: "Отчество",
            birthday: "Дата рождения",
            country: "Страна",
            city: "Город",
            email: "Email",
            about: "О себе",
            profession: "Профессия",
        },
        placeholders: {
            name: "Введите имя",
            surname: "Введите фамилию",
            secondName: "Введите отчество",
            email: "example@mail.com",
            about: "Расскажите немного о себе...",
        },
        common: {
            loading: "Загрузка...",
            saving: "Сохранение...",
            selectCountryFirst: "Сначала выберите страну",
            errorLoading: "Ошибка при загрузке профиля",
            errorSaving: "Произошла ошибка при сохранении",
        },
        emailHint: "Email нельзя изменить здесь. Откройте настройки, чтобы поменять его.",
        button: "Сохранить изменения",
        avatar: {
            label: "Фото профиля",
            upload: "Загрузить фото",
            change: "Изменить фото",
            remove: "Удалить",
            cropTitle: "Обрезать фото",
            cropConfirm: "Сохранить",
            cropCancel: "Отмена",
            hint: "JPG, PNG, до 5 МБ",
            saved: "Данные успешно сохранены",
            saveError: "Ошибка при сохранении",
            errors: {
                format: "Только PNG или JPG",
                size: "Файл больше {max} МБ",
                read: "Ошибка чтения файла",
            },
        },
    },
    en: {
        title: "Personal Information",
        subtitle: "Update your profile information",
        fields: {
            name: "First Name",
            surname: "Last Name",
            secondName: "Middle Name",
            birthday: "Date of Birth",
            country: "Country",
            city: "City",
            email: "Email",
            about: "About",
            profession: "Profession",
        },
        placeholders: {
            name: "Enter first name",
            surname: "Enter last name",
            secondName: "Enter middle name",
            email: "example@mail.com",
            about: "Tell us about yourself...",
        },
        common: {
            loading: "Loading...",
            saving: "Saving...",
            selectCountryFirst: "Select a country first",
            errorLoading: "Failed to load profile",
            errorSaving: "An error occurred while saving",
        },
        emailHint: "Email cannot be changed here. Open settings to change it.",
        button: "Save Changes",
        avatar: {
            label: "Profile photo",
            upload: "Upload photo",
            change: "Change photo",
            remove: "Remove",
            cropTitle: "Crop photo",
            cropConfirm: "Save",
            cropCancel: "Cancel",
            hint: "JPG, PNG, up to 5 MB",
            saved: "Changes saved successfully",
            saveError: "Failed to save",
            errors: {
                format: "Only PNG or JPG allowed",
                size: "File is larger than {max} MB",
                read: "Failed to read the file",
            },
        },
    },
    zh: {
        title: "个人信息",
        subtitle: "更新您的个人资料",
        fields: {
            name: "名字",
            surname: "姓氏",
            secondName: "中间名",
            birthday: "出生日期",
            country: "国家",
            city: "城市",
            email: "邮箱",
            about: "关于",
            profession: "职业",
        },
        placeholders: {
            name: "输入名字",
            surname: "输入姓氏",
            secondName: "输入中间名",
            email: "example@mail.com",
            about: "介绍一下您自己...",
        },
        common: {
            loading: "加载中...",
            saving: "保存中...",
            selectCountryFirst: "请先选择国家",
            errorLoading: "加载个人资料失败",
            errorSaving: "保存时发生错误",
        },
        emailHint: "邮箱不能在此修改，请前往设置更改。",
        button: "保存更改",
        avatar: {
            label: "头像",
            upload: "上传头像",
            change: "更换头像",
            remove: "删除",
            cropTitle: "裁剪头像",
            cropConfirm: "保存",
            cropCancel: "取消",
            hint: "JPG、PNG，最大 5 MB",
            saved: "保存成功",
            saveError: "保存失败",
            errors: {
                format: "仅支持 PNG 或 JPG",
                size: "文件超过 {max} MB",
                read: "读取文件失败",
            },
        },
    },
};

export const usePersonalInfoTranslation = (lang: Language) =>
    personalInfoTranslations[lang];