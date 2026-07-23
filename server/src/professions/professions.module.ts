import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProfessionsController } from './professions.controller';
import { ProfessionsService } from './professions.service';
import { Profession } from './profession.model';

@Module({
    imports: [SequelizeModule.forFeature([Profession])],
    controllers: [ProfessionsController],
    providers: [ProfessionsService],
    exports: [ProfessionsService],
})
export class ProfessionsModule {}