import { useState } from "react";
import { ConfirmComponent } from "../components/ui/ConfirmComponent/ConfirmComponent";

import { ConfirmContext, type ConfirmOptions } from './contexts';

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions | null;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        options: null,
        resolve: null,
    });

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
        setConfirmState({
            isOpen: false,
            options: null,
            resolve: null,
        });
    };

    const handleCancel = () => {
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
        setConfirmState({
            isOpen: false,
            options: null,
            resolve: null,
        });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {confirmState.isOpen && confirmState.options && (
                <ConfirmComponent
                    {...confirmState.options}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
};
