import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre } from './genre.model';
import { ArtType } from '../art-types/art-type.model';

@Module({
    imports: [
        SequelizeModule.forFeature([Genre, ArtType])
    ],
    controllers: [GenresController],
    providers: [GenresService],
    exports: [GenresService],
})
export class GenresModule implements OnModuleInit {
    constructor(private genresService: GenresService) {}

    async onModuleInit() {
        const count = await this.genresService['genreRepository'].count();
        if (count === 0) {
            await this.genresService.seedGenres();
        }
    }
}