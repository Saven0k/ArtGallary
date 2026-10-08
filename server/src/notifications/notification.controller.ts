import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Body,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ValidationPipe } from '../pipes/validation.pipe';
import {
  NotificationSettingsDto,
  PushSubscriptionDto,
  PushEndpointDto,
  TestNotificationDto,
} from './notification-settings.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAccessGuard, RolesGuard)
@UsePipes(ValidationPipe)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('settings')
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  getSettings(@CurrentUser() user: { id: number }) {
    return this.notificationService.getSettings(user.id);
  }

  @Patch('settings')
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  updateSettings(
    @CurrentUser() user: { id: number },
    @Body() dto: NotificationSettingsDto,
  ) {
    return this.notificationService.updateSettings(user.id, dto);
  }

  @Post('push')
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  subscribePush(
    @CurrentUser() user: { id: number },
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.notificationService.subscribePush(user.id, dto);
  }

  @Delete('push')
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  unsubscribePush(
    @CurrentUser() user: { id: number },
    @Body() dto: PushEndpointDto,
  ) {
    return this.notificationService.unsubscribePush(user.id, dto.endpoint);
  }

  @Post('test')
  @Roles(Role.User, Role.Author, Role.Admin, Role.Moderator)
  testNotification(
    @CurrentUser() user: { id: number },
    @Body() dto: TestNotificationDto,
  ) {
    return this.notificationService.testNotification(user.id, dto.channel);
  }

  @Get()
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Получить уведомления пользователя' })
  async getUserNotifications(
    @CurrentUser() user: { id: number; role: string },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationService.getUserNotifications(user.id, page, limit);
  }

  @Get('unread/count')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Получить количество непрочитанных уведомлений' })
  async getUnreadCount(@CurrentUser() user: { id: number; role: string }) {
    return { count: await this.notificationService.getUnreadCount(user.id) };
  }

  @Patch('read/all')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Отметить все уведомления как прочитанные' })
  async markAllAsRead(@CurrentUser() user: { id: number; role: string }) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete('delete/all')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Удалить все уведомления пользователя' })
  async deleteAll(@CurrentUser() user: { id: number; role: string }) {
    return this.notificationService.deleteAll(user.id);
  }

  @Patch(':id/read')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Отметить уведомление как прочитанное' })
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.notificationService.markAsRead(notificationId, user.id);
  }

  @Delete(':id')
  @Roles(Role.User, Role.Author, Role.Admin)
  @ApiOperation({ summary: 'Удалить одно уведомление' })
  async deleteOne(
    @Param('id', ParseIntPipe) notificationId: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.notificationService.deleteOne(notificationId, user.id);
  }
}
