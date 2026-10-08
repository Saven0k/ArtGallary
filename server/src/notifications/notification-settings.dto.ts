import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  ValidateIf,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class NotificationSettingsDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  emailEnabled?: boolean;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  pushEnabled?: boolean;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(['ru', 'en', 'zh'])
  language?: 'ru' | 'en' | 'zh';
}

export class PushEndpointDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint: string;
}

class PushKeysDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{87}=?$/)
  p256dh: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{22}={0,2}$/)
  auth: string;
}

export class PushSubscriptionDto extends PushEndpointDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class TestNotificationDto {
  @IsIn(['email', 'push'])
  channel: 'email' | 'push';
}
