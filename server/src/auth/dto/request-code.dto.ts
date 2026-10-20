import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class RequestCodeDto {
  @ApiProperty({ example: 'user@mail.ru' })
  @IsEmail()
  email: string;
}

export class VerifyAccountCodeDto {
  @ApiProperty({ example: '482193' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

export class VerifyCodeDto extends VerifyAccountCodeDto {
  @ApiProperty({ example: 'user@mail.ru' })
  @IsEmail()
  email: string;
}
