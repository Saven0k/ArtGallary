

import "./Toggle.scss";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
}

const Toggle = ({
    checked,
    onChange,
    disabled = false,
    label,
}: ToggleProps) => {
    return (
        <button
            type="button"
            className={`toggle ${checked ? "toggle--checked" : ""}`}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            role="switch"
            aria-checked={checked}
            aria-label={label}
        >
            <span className="toggle__thumb" />
        </button>
    );
};

export default Toggle;
