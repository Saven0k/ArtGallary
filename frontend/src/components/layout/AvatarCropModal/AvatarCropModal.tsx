// src/pages/Profile/components/ProfileContent/PersonalInfo/AvatarCropModal.tsx
import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImg, type PixelCrop } from '../../../utils/cropImage';
import './AvatarCropModal.scss';

interface AvatarCropModalProps {
    src: string;
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    onCancel: () => void;
    onConfirm: (file: File) => void;
}

const AvatarCropModal = ({
    src,
    title,
    confirmLabel,
    cancelLabel,
    onCancel,
    onConfirm,
}: AvatarCropModalProps) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onCropComplete = useCallback((_area: Area, pixels: Area) => {
        setCroppedAreaPixels({
            x: pixels.x,
            y: pixels.y,
            width: pixels.width,
            height: pixels.height,
        });
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setBusy(true);
        setError(null);
        try {
            const file = await getCroppedImg(src, croppedAreaPixels);
            onConfirm(file);
        } catch (e) {
            console.error('crop error:', e);
            setError('Не удалось обработать изображение');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="avatar-crop-overlay" onClick={onCancel} role="presentation">
            <div
                className="avatar-crop"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <h3 className="avatar-crop__title">{title}</h3>

                <div className="avatar-crop__stage">
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="avatar-crop__zoom">
                    <span>−</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        aria-label="Zoom"
                    />
                    <span>+</span>
                </div>

                {error && <div className="avatar-crop__error">{error}</div>}

                <div className="avatar-crop__actions">
                    <button
                        type="button"
                        className="avatar-crop__btn avatar-crop__btn--secondary"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="avatar-crop__btn avatar-crop__btn--primary"
                        onClick={handleConfirm}
                        disabled={busy}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;