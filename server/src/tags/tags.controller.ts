import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.tagsService.searchTags(q);
  }

  @Get('popular')
  popular(@Query('limit') limit?: number) {
    return this.tagsService.getPopularTags(Number(limit) || 20);
  }
}
