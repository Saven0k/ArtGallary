import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  messages: string | Record<string, unknown>;
  constructor(response: string | Record<string, unknown>) {
    super(response, HttpStatus.BAD_REQUEST);
    this.messages = response;
  }
}
