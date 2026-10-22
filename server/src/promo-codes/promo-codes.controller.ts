import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ValidationPipe } from '../pipes/validation.pipe';
import {
  CreatePromoCodeDto,
  PromoCodeListDto,
  PromoCodeStatusDto,
  ValidatePromoCodeDto,
} from './promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

@ApiTags('promo-codes')
@ApiBearerAuth()
@Controller('promo-codes')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.Admin)
@UsePipes(ValidationPipe)
export class PromoCodesController {
  constructor(private readonly service: PromoCodesService) {}

  @Post('validate')
  @Roles(Role.User, Role.Author, Role.Moderator, Role.Admin)
  @ApiOperation({ summary: 'Проверить действующий промокод для корзины' })
  async validate(@Body() dto: ValidatePromoCodeDto) {
    const promo = await this.service.getValid(dto.code);
    return {
      code: promo.code,
      percent: promo.percent,
      expiresAt: promo.expiresAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Список промокодов (администратор)' })
  list(@Query() query: PromoCodeListDto) {
    return this.service.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Создать промокод (администратор)' })
  create(@Body() dto: CreatePromoCodeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Включить или отключить промокод (администратор)' })
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PromoCodeStatusDto,
  ) {
    return this.service.setActive(id, dto.active);
  }
}
