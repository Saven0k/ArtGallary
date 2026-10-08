import { HttpException, HttpStatus } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';
import { inspect } from 'node:util';

export function handleError(
  logger: WinstonLogger,
  method: string,
  error: unknown,
  statusCode: number = HttpStatus.BAD_REQUEST,
): never {
  logger.error(
    `Error in ${method}:`,
    error instanceof Error ? error.stack : inspect(error),
  );

  if (error instanceof HttpException) {
    throw error;
  }

  throw new HttpException(
    `Error in ${method}: ${error instanceof Error ? error.message : inspect(error)}`,
    statusCode,
  );
}
