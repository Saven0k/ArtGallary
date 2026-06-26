import { useState } from "react";
import { useNotification } from "../../../context/NotificationContext";
import { useLanguage } from "../../../context/LanguageContext";
import { typeFormTranslations } from "./lang";

export const StyleForm = () => {
    const { language } = useLanguage();
    const lang = typeFormTranslations[language];
    
    const [formData, setFormData] = useState({
        name: "",
        schema: ""
    });

    const { showNotification } = useNotification();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification(lang.validation.nameRequired, "error");
            return;
        }

        if (!formData.schema.trim()) {
            showNotification(lang.validation.schemaRequired, "error");
            return;
        }

        console.log("Тип создан:", formData);

        showNotification(lang.notifications.success, "success");

        setFormData({
            name: "",
            schema: ""
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
                    <label className="form__label">{lang.fields.schema}</label>
                    <input
                        type="text"
                        name="schema"
                        className="form__input"
                        placeholder={lang.placeholders.schema}
                        value={formData.schema}
                        onChange={handleChange}
                    />
                </div>

            </div>

            <button className="form__btn">{lang.buttons.submit}</button>
        </form>
    );
};