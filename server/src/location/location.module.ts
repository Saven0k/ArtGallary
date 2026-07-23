import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Country } from './models/country.model';
import { City } from './models/city.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Country, City]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}