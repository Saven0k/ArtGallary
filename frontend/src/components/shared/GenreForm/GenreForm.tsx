import { useState } from "react";
import { useNotification } from "../../../context/NotificationContext";
import { useLanguage } from "../../../context/LanguageContext";
import { genreFormTranslations } from "./lang";

export const GenreForm = () => {
    const { language } = useLanguage();
    const lang = genreFormTranslations[language];
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        typeId: ""
    });

    const { showNotification } = useNotification();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification(lang.validation.nameRequired, "error");
            return;
        }
        // TODO: API запрос
        console.log("Жанр создан:", formData);

        showNotification(lang.notifications.success, "success");

        setFormData({
            name: "",
            description: "",
            typeId: ""
        });
    };

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h2 className="form__title">{lang.title}</h2>

            <div className="form__inputs">

                <div className="form__input-box">
                    <label className="form__label">{lang.fields.name}</label>
                    <input
                        type="text"
                        name="name"
                        className="form__input"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div className="form__input-box">
                    <label className="form__label">{lang.fields.description}</label>
                    <input
                        type="text"
                        name="description"
                        className="form__input"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="form__input-box">
                    <label className="form__label">{lang.fields.type}</label>
                    <select
                        name="typeId"
                        className="form__input"
                        value={formData.typeId}
                        onChange={handleChange}
                    >
                        {/* TODO: пройтись по списку типов. Сделать запрос */}
                        <option value="">{lang.placeholders.selectType}</option>
                        <option value="1">Тип 1</option>
                        <option value="2">Тип 2</option>
                    </select>
                </div>

            </div>

            <button className="form__btn">{lang.buttons.submit}</button>
        </form>
    );
};