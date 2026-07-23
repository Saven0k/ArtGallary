import { HttpException, HttpStatus } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

export function buildPagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
