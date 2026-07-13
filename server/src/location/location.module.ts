// src/location/location.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationApiService } from './location-api.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 10000,
            maxRedirects: 5,
        }),
        CacheModule.register({
            ttl: 86400000, // 24 часа
            max: 100,
        }),
    ],
    controllers: [LocationController],
    providers: [LocationService, LocationApiService],
    exports: [LocationService],
})
export class LocationModule {}