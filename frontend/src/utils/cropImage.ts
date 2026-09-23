// src/utils/cropImage.ts
export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (err) => reject(err));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Обрезает изображение по pixelCrop и возвращает Blob.
 * Формат — JPEG, качество 0.92.
 */
export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: PixelCrop,
    fileName = 'avatar.jpg',
): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas context is null');

    const targetSize = 512; // квадрат 512x512 — оптимально для аватара

    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetSize,
        targetSize,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(new File([blob], fileName, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.92,
        );
    });
};