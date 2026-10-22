import { User } from '../users/users.model';
import { Art } from '../arts/arts.model';
import { Genre } from '../genres/genre.model';
import { AuthorProfile } from '../authors/author.model';
import { RefreshToken } from '../auth/models/refresh-token.model';
import { PasswordResetCode } from '../auth/models/password-reset-code.model';
import { AccountDeletionCode } from '../auth/models/account-deletion-code.model';
import { EmailChangeCode } from '../auth/models/email-change-code.model';
import { Cart } from '../cart/cart.model';
import { CartHistory } from '../cart-history/cart-history.model';
import { PromoCode } from '../promo-codes/promo-code.model';
import { ArtView } from '../arts/art-view.model';
import { Moderator } from '../moderators/moderator.model';
import { ArtType } from '../art-types/art-type.model';
import { Profession } from '../professions/profession.model';
import { Style } from '../styles/styles.model';
import { SiteVisit } from '../site/models/site-visit.model';
import { SiteRating } from '../site/models/site-rating.model';
import { Tag } from '../tags/tag.model';
import { ArtTag } from '../tags/art-tag.model';
import { Country } from '../location/models/country.model';
import { City } from '../location/models/city.model';
import { Event } from '../events/event.model';
import { Subscription } from '../subscriptions/subscription.model';
import { ArtLike } from '../arts/art-like.model';
import { AuthorView } from '../authors/author-view.model';
import { SubscriptionHistory } from '../subscriptions/subscription-history.model';
import { Notification } from '../notifications/notification.model';
import { NotificationSettings } from '../notifications/notification-settings.model';
import { BrowserPushSubscription } from '../notifications/push-subscription.model';
import { AuthorFollow } from '../authors/author-follow.model';
import { ContentTranslation } from '../translation/translation.model';
import {
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
} from '../telegram/telegram.models';

export const GALLERY_MODELS = [
  User,
  Art,
  Genre,
  AuthorProfile,
  RefreshToken,
  PasswordResetCode,
  AccountDeletionCode,
  EmailChangeCode,
  Cart,
  CartHistory,
  PromoCode,
  ArtView,
  Moderator,
  ArtType,
  Profession,
  Style,
  SiteVisit,
  SiteRating,
  Tag,
  ArtTag,
  Country,
  City,
  Event,
  Subscription,
  ArtLike,
  AuthorView,
  SubscriptionHistory,
  Notification,
  NotificationSettings,
  BrowserPushSubscription,
  AuthorFollow,
  ContentTranslation,
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
];
