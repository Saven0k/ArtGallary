import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) {}

    async createFile(file: any): Promise<string> {
        if (!file || !file.buffer) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new HttpException('File too large (max 10MB)', HttpStatus.BAD_REQUEST);
        }

        const fileExtension = file.originalname?.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${uuid.v4()}.${fileExtension}`;
        const staticDir = path.resolve(process.cwd(), 'src', 'static');
        const resolvedPath = path.resolve(staticDir, fileName);

        if (!resolvedPath.startsWith(path.resolve(staticDir))) {
            throw new HttpException('Invalid file path', HttpStatus.FORBIDDEN);
        }

        if (!fs.existsSync(staticDir)) {
            fs.mkdirSync(staticDir, { recursive: true });
        }

        fs.writeFileSync(resolvedPath, file.buffer);

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return `${baseUrl}/static/${fileName}`;
    }

    async removeFile(fileURL: string) {
        const cleanUrl = fileURL.replace(/^https?:\/\//, '').replace(/^\/static\//, '');
        const fileName = cleanUrl.split('/').filter(Boolean).pop();

        if (!fileName) {
            throw new HttpException('Invalid file URL', HttpStatus.BAD_REQUEST);
        }

        const staticDir = path.resolve(process.cwd(), 'src', 'static');
        const resolvedPath = path.resolve(staticDir, fileName);

        if (!resolvedPath.startsWith(path.resolve(staticDir))) {
            throw new HttpException('Invalid file path', HttpStatus.FORBIDDEN);
        }

        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
        }
    }
}
