import { resolve } from 'path';

/**
 * Каталог для загруженных файлов (изображения артов, аватары).
 * По умолчанию — src/static (как было). В production задайте STATIC_DIR
 * вне исходников, чтобы git pull / пересборка не трогали загрузки.
 * Относительный путь считается от process.cwd() (каталог server/).
 */
export const STATIC_DIR = resolve(
  process.cwd(),
  process.env.STATIC_DIR || 'src/static',
);

export function staticFileUrl(fileName: string): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl.replace(/\/+$/, '')}/static/${fileName}`;
}

export function publicImageUrl(key: string, value: unknown): unknown {
  if (
    !['image_path', 'avatar_path', 'imagePath', 'image'].includes(key) ||
    typeof value !== 'string'
  )
    return value;
  const match =
    /^(?:https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?)?\/(?:api\/)?static\/([a-f0-9-]{36}\.(?:png|jpe?g|gif|webp))$/i.exec(
      value,
    );
  return match ? staticFileUrl(match[1]) : value;
}
