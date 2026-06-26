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
import { StyleModule } from './styles/styles.module';
import { ArtistsModule } from './artists/artists.module';
import { PasswordModule } from './password/password.module';
import { ExhibitionsModule } from './exhibitions/exhibitions.module';
import { Exhibition } from "./exhibitions/exhibition.model";
import { ArtistProfile } from "./artists/artist.model";
import { ExhibitionArtist } from "./exhibitions/exhibition-artist.model";
import { ExhibitionArt } from "./exhibitions/exhibition-art.model";

import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { RefreshToken } from "./auth/models/refresh-token.model";
import { ExhibitionUser } from "./exhibitions/exhibition-user.model";
import { ModeratorsModule } from './moderators/moderators.module';
import { Moderator } from "./moderators/moderator.model";
import { TranslationModule } from './translation/translation.module';
import { LocationModule } from './location/location.module';
import { ArtTypesModule } from './art-types/art-types.module';

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
            models: [User, Art, Genre, Exhibition, ArtistProfile, ExhibitionArtist, ExhibitionArt, ExhibitionUser, RefreshToken, Moderator],
            autoLoadModels: true,
            logging: console.log,
            query: {
                raw: true,
            },
        }),
        UsersModule,
        ArtsModule,
        AuthModule,
        GenresModule,
        FilesModule,
        StyleModule,
        ArtistsModule,
        PasswordModule,
        ExhibitionsModule,
        ModeratorsModule,
        TranslationModule,
        LocationModule,
        ArtTypesModule,
    ],
})
export class AppModule {

}