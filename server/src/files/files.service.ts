import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class FilesService {

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) { }

    async createFile(file: any): Promise<string> {
        this.logger.log('debug', JSON.stringify({
            message: '🖼️ Начало сохранения файла',
            context: 'FilesService.createFile',
            fileSize: file?.size,
            fileMimetype: file?.mimetype
        }));

        try {
            const fileExtension = file.originalname?.split('.').pop() || 'jpg';
            const fileName = `${uuid.v4()}.${fileExtension}`;

            const staticDir = path.resolve(process.cwd(), "src", "static");
            const filePath = path.join(staticDir, fileName);

            this.logger.log('debug', JSON.stringify({
                message: '📁 Проверка директории',
                context: 'FilesService.createFile',
                filePath: filePath,
                fileName: fileName
            }));

            if (!fs.existsSync(staticDir)) {
                this.logger.log('debug', JSON.stringify({
                    message: '📁 Создание директории',
                    context: 'FilesService.createFile',
                    staticDir: staticDir
                }));
                fs.mkdirSync(staticDir, { recursive: true });
            }

            fs.writeFileSync(filePath, file.buffer);

            const relativeUrl = `/static/${fileName}`;

            this.logger.log('info', JSON.stringify({
                message: '✅ Файл успешно сохранен',
                context: 'FilesService.createFile',
                fileName: fileName,
                filePath: filePath,
                relativeUrl: relativeUrl
            }));

            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const fullUrl = `${baseUrl}/static/${fileName}`;

            return fullUrl;
        } catch (e:any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при сохранении файла',
                context: 'FilesService.createFile',
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException("Произошла ошибка при записи файла", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async removeFile(fileURL: string) {
        this.logger.log('warn', JSON.stringify({
            message: '🗑️ Начало удаления файла',
            context: 'FilesService.removeFile',
            filePath: fileURL
        }));

        try {
            const fileName = fileURL.split('/').pop() || "";
            const staticDir = path.resolve(process.cwd(), "src", "static");
            const filePath = path.join(staticDir, fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log('info', JSON.stringify({
                    message: '✅ Файл успешно удален',
                    context: 'FilesService.removeFile',
                    filePath: filePath
                }));
            } else {
                this.logger.log('warn', JSON.stringify({
                    message: '⚠️ Файл не найден для удаления',
                    context: 'FilesService.removeFile',
                    filePath: filePath
                }));
            }
        } catch (e:any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при удалении файла',
                context: 'FilesService.removeFile',
                filePath: fileURL,
                error: e.message,
                stack: e.stack
            }));
            throw new HttpException("Произошла ошибка при удалении файла", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}