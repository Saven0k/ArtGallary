import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { VerifyAccountCodeDto } from './request-code.dto';

export class VerifyCurrentEmailDto {
  @ApiProperty({ example: 'user@mail.ru' })
  @IsEmail()
  email: string;
}

export class RequestEmailChangeCodeDto {
  @ApiProperty({ example: 'new@mail.ru' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  newEmail: string;
}

export class ConfirmEmailChangeDto extends VerifyAccountCodeDto {
  @ApiProperty({ example: 'new@mail.ru' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  newEmail: string;
}

export class VerifyPasswordDto {
  @ApiProperty({ example: 'myPassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}
