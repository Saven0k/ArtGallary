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
