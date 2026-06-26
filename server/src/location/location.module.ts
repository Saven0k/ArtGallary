// src/location/location.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationApiService } from './location-api.service';
import { TranslationModule } from '../translation/translation.module';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        CacheModule.register({
            ttl: 86400, 
            max: 100,
        }),
        TranslationModule,
    ],
    controllers: [LocationController],
    providers: [LocationService, LocationApiService],
    exports: [LocationService, LocationApiService],
})
export class LocationModule {}