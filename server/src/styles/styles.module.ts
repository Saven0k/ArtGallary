import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Style } from './styles.model';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';

@Module({
  providers: [StylesService],
  controllers: [StylesController],
  imports: [
      SequelizeModule.forFeature([Style]),
    ],
})
export class StyleModule {}
