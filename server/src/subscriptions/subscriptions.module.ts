import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subscription } from './subscription.model';
import { SubscriptionHistory } from './subscription-history.model';
import { SubscriptionService } from './subscriptions.service';
import { SubscriptionController } from './subscriptions.controller';
import { AuthorProfile } from 'src/authors/author.model';

@Module({
    imports: [SequelizeModule.forFeature([Subscription, SubscriptionHistory, AuthorProfile])],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}