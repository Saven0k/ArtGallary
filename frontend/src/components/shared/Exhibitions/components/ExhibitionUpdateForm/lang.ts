export const exhibitionUpdateFormTranslations = {
    ru: {
        title: "Редактировать выставку",
        loading: "Загружаем данные выставки...",
        fields: {
            title: "Название выставки *",
            titlePlaceholder: "Например: Импрессионизм в XXI веке",
            description: "Описание *",
            descriptionPlaceholder: "Расскажите о выставке...",
            address: "Адрес *",
            addressPlaceholder: "ул. Пушкина, д. 10",
            date: "Дата проведения *",
            cost: "Стоимость билета *",
            costPlaceholder: "500₽ / Бесплатно",
            image: "Фото выставки",
            changeImage: "Изменить фото",
            selectImage: "Выберите фото выставки"
        },
        buttons: {
            submit: "💾 Сохранить изменения",
            submitting: "Сохранение...",
            cancel: "← Отмена"
        },
        validation: {
            titleRequired: "Введите название выставки",
            descriptionRequired: "Введите описание выставки",
            addressRequired: "Введите адрес выставки",
            dateRequired: "Выберите дату проведения",
            costRequired: "Укажите стоимость билета"
        },
        notifications: {
            fillRequired: "Пожалуйста, заполните все обязательные поля",
            imageInvalid: "Пожалуйста, выберите изображение",
            imageTooLarge: "Размер файла не должен превышать 10MB",
            notFound: "Выставка не найдена",
            loadError: "Ошибка при загрузке выставки",
            updateSuccess: "Выставка успешно обновлена! 🎉",
            updateError: "Ошибка при обновлении выставки"
        }
    },
    en: {
        title: "Edit Exhibition",
        loading: "Loading exhibition data...",
        fields: {
            title: "Exhibition title *",
            titlePlaceholder: "Example: Impressionism in the 21st Century",
            description: "Description *",
            descriptionPlaceholder: "Tell about the exhibition...",
            address: "Address *",
            addressPlaceholder: "Pushkina str., 10",
            date: "Date *",
            cost: "Ticket price *",
            costPlaceholder: "500₽ / Free",
            image: "Exhibition photo",
            changeImage: "Change photo",
            selectImage: "Select exhibition photo"
        },
        buttons: {
            submit: "💾 Save changes",
            submitting: "Saving...",
            cancel: "← Cancel"
        },
        validation: {
            titleRequired: "Enter exhibition title",
            descriptionRequired: "Enter exhibition description",
            addressRequired: "Enter exhibition address",
            dateRequired: "Select date",
            costRequired: "Enter ticket price"
        },
        notifications: {
            fillRequired: "Please fill in all required fields",
            imageInvalid: "Please select an image",
            imageTooLarge: "File size must not exceed 10MB",
            notFound: "Exhibition not found",
            loadError: "Error loading exhibition",
            updateSuccess: "Exhibition successfully updated! 🎉",
            updateError: "Error updating exhibition"
        }
    }
};