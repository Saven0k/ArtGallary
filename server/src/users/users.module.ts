import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from '../arts/arts.model';
import { ArtistProfile } from '../artists/artist.model';
import { PasswordModule } from '../password/password.module';
import { FilesModule } from '../files/files.module';
import { LocationModule } from 'src/location/location.module';
import { Profession } from 'src/professions/profession.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([User, Art, ArtistProfile, Profession, City, Country]),
    PasswordModule, FilesModule,LocationModule
  ],
  exports: [UsersService, SequelizeModule]
})
export class UsersModule { }
