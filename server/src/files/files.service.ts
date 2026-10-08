import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { STATIC_DIR } from '../shared/helpers/static-dir.helper';

export interface UploadedImage {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_OPTIONS = {
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
};

export function imageExtension(buffer: Buffer): string | null {
  if (
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) &&
    buffer.toString('ascii', 12, 16) === 'IHDR' &&
    buffer.subarray(-12).equals(Buffer.from('0000000049454e44ae426082', 'hex'))
  )
    return 'png';
  if (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff &&
    buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
  )
    return 'jpg';
  if (
    buffer.length >= 14 &&
    ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)) &&
    buffer[buffer.length - 1] === 0x3b
  )
    return 'gif';
  if (
    buffer.length >= 20 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(buffer.toString('ascii', 12, 16)) &&
    buffer.readUInt32LE(4) + 8 === buffer.length
  )
    return 'webp';
  return null;
}

@Injectable()
export class FilesService {
  async createFile(file: UploadedImage): Promise<string> {
    if (!file || !Buffer.isBuffer(file.buffer))
      throw new BadRequestException('File is required');
    if (file.buffer.length > MAX_FILE_SIZE)
      throw new BadRequestException('File too large (max 10MB)');
    const extension = imageExtension(file.buffer);
    if (!extension)
      throw new BadRequestException('Unsupported or invalid image');
    const fileName = `${randomUUID()}.${extension}`;
    await fs.mkdir(STATIC_DIR, { recursive: true });
    await fs.writeFile(path.join(STATIC_DIR, fileName), file.buffer, {
      flag: 'wx',
    });
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/static/${fileName}`;
  }

  async removeFile(fileURL: string): Promise<void> {
    const fileName = path.basename(
      new URL(fileURL, 'http://localhost').pathname,
    );
    if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(fileName))
      throw new BadRequestException('Invalid file URL');
    await fs.rm(path.join(STATIC_DIR, fileName), { force: true });
  }
}
