import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { UsersModule } from './users/users.module';
import { ConfigModule } from "@nestjs/config";
import { User } from "./users/users.model";
import { ArtsModule } from './arts/arts.module';
import { AuthModule } from './auth/auth.module';
import { GenresModule } from './genres/genres.module';
import { Genre } from "./genres/genre.model";
import { Art } from "./arts/arts.model";
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from "@nestjs/serve-static";
import { resolve } from "path";
import { StylesModule } from './styles/styles.module';
import { ArtistsModule } from './artists/artists.module';
import { PasswordModule } from './password/password.module';
import { ArtistProfile } from "./artists/artist.model";

import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { RefreshToken } from "./auth/models/refresh-token.model";
import { ModeratorsModule } from './moderators/moderators.module';
import { Moderator } from "./moderators/moderator.model";
import { ArtTypesModule } from './art-types/art-types.module';
import { Style } from "./styles/styles.model";
import { ArtView } from "./arts/art-view.model";
import { ArtType } from "./art-types/art-type.model";
import { ProfessionsModule } from './professions/professions.module';
import { LocationModule } from './location/location.module';
import { Profession } from "./professions/profession.model";
import { TagsModule } from './tags/tags.module';
import { Tag } from "./tags/tag.model";
import { ArtTag } from "./tags/art-tag.model";

@Module({
    controllers: [],
    providers: [],
    imports: [
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        utilities.format.nestLike('MyApp', {
                            colors: true,
                            prettyPrint: true,
                        }),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/app.log',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                }),
            ],
        }),
        ServeStaticModule.forRoot({
            rootPath: resolve(__dirname, "../src", 'static'),
        }),
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
            isGlobal: true,
        }),
        SequelizeModule.forRoot({
            dialect: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            models: [User, Art, Genre,  ArtistProfile, RefreshToken, ArtView, Moderator, ArtType, Profession, Style, Tag,ArtTag],
            autoLoadModels: true,
            logging: console.log,
            query: {
                raw: true,
            },
            synchronize: true
        }),
        UsersModule,
        ArtsModule,
        AuthModule,
        GenresModule,
        FilesModule,
        StylesModule,
        ArtistsModule,
        PasswordModule,
        ModeratorsModule,
        ArtTypesModule,
        LocationModule,
        ProfessionsModule,
        TagsModule,
    ],
})
export class AppModule {}