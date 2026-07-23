import { HttpException, HttpStatus } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

export function handleError(
    logger: WinstonLogger,
    method: string,
    error: any,
    statusCode: number = HttpStatus.BAD_REQUEST,
): never {
    logger.error(`Error in ${method}:`, error);

    if (error instanceof HttpException) {
        throw error;
    }

    throw new HttpException(
        `Error in ${method}: ${error.message}`,
        statusCode,
    );
}
