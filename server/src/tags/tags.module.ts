import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tag } from './tag.model';
import { ArtTag } from './art-tag.model';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
  imports: [
    SequelizeModule.forFeature([
      Tag,
      ArtTag
    ]),
  ],
})
export class TagsModule { }
