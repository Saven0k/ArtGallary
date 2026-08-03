import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from '../arts/arts.model';
import { PasswordModule } from '../password/password.module';
import { FilesModule } from '../files/files.module';
import { LocationModule } from 'src/location/location.module';
import { Profession } from 'src/professions/profession.model';
import { City } from 'src/location/models/city.model';
import { Country } from 'src/location/models/country.model';
import { AuthorProfile } from 'src/authors/author.model';
import { AuthorsModule } from 'src/authors/authors.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([User, Art, AuthorProfile, Profession, City, Country]),
    PasswordModule, FilesModule,LocationModule, AuthorsModule
  ],
  exports: [UsersService, SequelizeModule]
})
export class UsersModule { }
