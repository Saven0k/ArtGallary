import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ModeratorsService } from './moderators.service';
import { CreateModeratorDto } from './dto/create-moderator.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_UPLOAD_OPTIONS } from '../files/files.service';
import { UpdateModeratorDto } from './dto/update-moderator.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('Модераторы')
@ApiBearerAuth()
@Controller('moderators')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(JwtAccessGuard, RolesGuard)
export class ModeratorsController {
  constructor(private moderatorsService: ModeratorsService) {}

  @ApiOperation({ summary: 'Получение модератора по ID' })
  @Get(':id')
  @Roles(Role.Admin)
  getModeratorById(@Param('id', ParseIntPipe) id: number) {
    return this.moderatorsService.getModeratorById(id);
  }

  @ApiOperation({ summary: 'Создание модератора' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('avatar_path', IMAGE_UPLOAD_OPTIONS))
  createModerator(
    @Body() dto: CreateModeratorDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.moderatorsService.createModerator(dto, adminId);
  }

  @Put(':id')
  @Roles(Role.Admin)
  updateModerator(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModeratorDto,
  ) {
    return this.moderatorsService.updateModerator(id, dto);
  }

  @ApiOperation({ summary: 'Удаление модератора' })
  @Delete(':id')
  @Roles(Role.Admin)
  deleteModerator(@Param('id', ParseIntPipe) id: number) {
    return this.moderatorsService.deleteModerator(id);
  }

  @ApiOperation({ summary: 'Получение списка модераторов' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  @Roles(Role.Admin)
  getModerators(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.moderatorsService.getModerators(
      parseInt(page),
      parseInt(limit),
    );
  }
}
