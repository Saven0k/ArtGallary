// src/pages/Settings/components/Toggle.tsx

import "./Toggle.scss";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const Toggle = ({
    checked,
    onChange,
    disabled = false,
}: ToggleProps) => {
    return (
        <button
            type="button"
            className={`toggle ${checked ? "toggle--checked" : ""}`}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            aria-pressed={checked}
            aria-label="Переключатель"
        >
            <span className="toggle__thumb" />
        </button>
    );
};

export default Toggle;