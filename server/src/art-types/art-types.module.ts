import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ArtTypesController } from './art-types.controller';
import { ArtTypesService } from './art-types.service';
import { ArtType } from './art-type.model';

@Module({
    imports: [
        SequelizeModule.forFeature([ArtType])
    ],
    controllers: [ArtTypesController],
    providers: [ArtTypesService],
    exports: [ArtTypesService],
})
export class ArtTypesModule implements OnModuleInit {
    constructor(private artTypesService: ArtTypesService) {}

    async onModuleInit() {
        const count = await this.artTypesService['artTypeRepository'].count();
        if (count === 0) {
            await this.artTypesService.seedArtTypes();
        }
    }
}