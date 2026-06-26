import { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { dynamicMetadataTranslations } from "./lang";
import "./index.css";

interface MetadataField {
    id: string;
    label: string;
    value: string;
}

interface DynamicMetadataInputProps {
    value: string;
    onChange: (jsonString: string) => void;
    onError?: (error: string | null) => void;
}

export const DynamicMetadataInput: React.FC<DynamicMetadataInputProps> = ({
    value,
    onChange,
    onError
}) => {
    const { language } = useLanguage();
    const lang = dynamicMetadataTranslations[language];

    const availableFields = [
        { id: "width", label: lang.fields.width, placeholder: lang.units.placeholder.width, unit: lang.units.cm },
        { id: "height", label: lang.fields.height, placeholder: lang.units.placeholder.height, unit: lang.units.cm },
        { id: "thickness", label: lang.fields.thickness, placeholder: lang.units.placeholder.thickness, unit: lang.units.cm },
        { id: "color", label: lang.fields.color, placeholder: lang.units.placeholder.color, unit: "" },
        { id: "material", label: lang.fields.material, placeholder: lang.units.placeholder.material, unit: "" },
        { id: "technique", label: lang.fields.technique, placeholder: lang.units.placeholder.technique, unit: "" },
        { id: "year", label: lang.fields.year, placeholder: lang.units.placeholder.year, unit: "" },
        { id: "style", label: lang.fields.style, placeholder: lang.units.placeholder.style, unit: "" },
    ];

    const [selectedField, setSelectedField] = useState<string>("");
    const [fieldValue, setFieldValue] = useState<string>("");
    const [customFields, setCustomFields] = useState<MetadataField[]>(() => {
        try {
            const parsed = value ? JSON.parse(value) : {};
            return Object.entries(parsed).map(([key, val]) => ({
                id: key,
                label: getLabelByKey(key),
                value: String(val)
            }));
        } catch {
            return [];
        }
    });

    function getLabelByKey(key: string): string {
        const field = availableFields.find(f => f.id === key);
        return field?.label || key;
    }

    const updateMetadata = (fields: MetadataField[]) => {
        const metadataObject: Record<string, string> = {};
        fields.forEach(field => {
            if (field.value.trim()) {
                metadataObject[field.id] = field.value;
            }
        });
        const jsonString = JSON.stringify(metadataObject);
        onChange(jsonString);
    };

    const handleAddField = () => {
        if (!selectedField) {
            onError?.(lang.errors.selectField);
            return;
        }
        if (!fieldValue.trim()) {
            onError?.(lang.errors.enterValue);
            return;
        }

        const existingIndex = customFields.findIndex(f => f.id === selectedField);
        if (existingIndex !== -1) {
            const updated = [...customFields];
            updated[existingIndex] = { ...updated[existingIndex], value: fieldValue };
            setCustomFields(updated);
            updateMetadata(updated);
        } else {
            const newField: MetadataField = {
                id: selectedField,
                label: availableFields.find(f => f.id === selectedField)?.label || selectedField,
                value: fieldValue
            };
            const updated = [...customFields, newField];
            setCustomFields(updated);
            updateMetadata(updated);
        }

        setSelectedField("");
        setFieldValue("");
        onError?.(null);
    };

    const handleRemoveField = (id: string) => {
        const updated = customFields.filter(f => f.id !== id);
        setCustomFields(updated);
        updateMetadata(updated);
    };

    const handleUpdateField = (id: string, newValue: string) => {
        const updated = customFields.map(f =>
            f.id === id ? { ...f, value: newValue } : f
        );
        setCustomFields(updated);
        updateMetadata(updated);
    };

    return (
        <div className="dynamic-metadata">
            {customFields.length > 0 && (
                <div className="dynamic-metadata__section">
                    <label className="dynamic-metadata__title">{lang.title}</label>
                    <div className="dynamic-metadata__fields">
                        {customFields.map(field => (
                            <div key={field.id} className="dynamic-metadata__field">
                                <span className="dynamic-metadata__field-label">
                                    {field.label}:
                                </span>
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => handleUpdateField(field.id, e.target.value)}
                                    className="dynamic-metadata__field-input"
                                    placeholder={lang.valuePlaceholder}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveField(field.id)}
                                    className="dynamic-metadata__remove-btn"
                                >
                                    {lang.removeButton}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dynamic-metadata__add-section">
                <label className="dynamic-metadata__add-title">{lang.addLabel}</label>
                <div className="dynamic-metadata__add-controls">
                    <select
                        value={selectedField}
                        onChange={(e) => setSelectedField(e.target.value)}
                        className="dynamic-metadata__select"
                    >
                        <option value="">{lang.selectPlaceholder}</option>
                        {availableFields.map(field => (
                            <option key={field.id} value={field.id}>
                                {field.label} {field.unit ? `(${field.unit})` : ""}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        className="dynamic-metadata__input"
                        placeholder={lang.valuePlaceholder}
                    />
                    <button
                        type="button"
                        onClick={handleAddField}
                        className="dynamic-metadata__add-btn"
                    >
                        {lang.addButton}
                    </button>
                </div>
            </div>

            {customFields.length > 0 && (
                <div className="dynamic-metadata__preview">
                    <strong>{lang.jsonPreview}</strong> {JSON.stringify(Object.fromEntries(
                        customFields.map(f => [f.id, f.value])
                    ))}
                </div>
            )}
        </div>
    );
};