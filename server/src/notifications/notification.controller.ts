// src/notifications/notification.controller.ts
import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAccessGuard, RolesGuard)
export class NotificationController {
    constructor(private notificationService: NotificationService) {}

    @Get()
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Получить уведомления пользователя' })
    async getUserNotifications(
        @CurrentUser() user: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.notificationService.getUserNotifications(user.id, page, limit);
    }

    @Get('unread/count')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Получить количество непрочитанных уведомлений' })
    async getUnreadCount(@CurrentUser() user: any) {
        return { count: await this.notificationService.getUnreadCount(user.id) };
    }

    @Patch(':id/read')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Отметить уведомление как прочитанное' })
    async markAsRead(
        @Param('id') notificationId: number,
        @CurrentUser() user: any,
    ) {
        return this.notificationService.markAsRead(notificationId, user.id);
    }

    @Patch('read/all')
    @Roles(Role.User, Role.Author, Role.Admin)
    @ApiOperation({ summary: 'Отметить все уведомления как прочитанные' })
    async markAllAsRead(@CurrentUser() user: any) {
        return this.notificationService.markAllAsRead(user.id);
    }
}