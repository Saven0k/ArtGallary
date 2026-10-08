/**
 * Загружает .<NODE_ENV>.env и .env ДО импорта AppModule.
 *
 * ConfigModule.forRoot() читает env-файлы только в момент сборки модуля, а
 * PORT в main.ts, COOKIE_SECURE в auth.service.ts, STATIC_DIR и т.п. читаются
 * раньше — при импорте файлов. Поэтому env-файлы подгружаем первым делом.
 * Переменные, уже заданные в окружении процесса (pm2 / docker / systemd),
 * dotenv не перезаписывает.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

const env = process.env.NODE_ENV || 'development';
if (env !== 'production') config({ path: resolve(process.cwd(), 'dev.env') });
config({ path: resolve(process.cwd(), `.${env}.env`) });
config({ path: resolve(process.cwd(), '.env') });
