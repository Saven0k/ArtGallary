import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Art } from '../arts/arts.model';
import { ArtistProfile } from '../artists/artist.model';
import { PasswordModule } from '../password/password.module';
import { FilesModule } from '../files/files.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([User, Art, ArtistProfile]),
    PasswordModule, FilesModule
  ],
  exports: [UsersService, SequelizeModule]
})
export class UsersModule { }
