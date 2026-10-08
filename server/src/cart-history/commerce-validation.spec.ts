import 'reflect-metadata';
import { PIPES_METADATA } from '@nestjs/common/constants';
import { CartController } from '../cart/cart.controller';
import { SubscriptionController } from '../subscriptions/subscriptions.controller';
import { ValidationPipe } from '../pipes/validation.pipe';
import { CartHistoryController } from './cart-history.controller';
import { CheckoutDto, UpdateStatusDto } from './dto/cart-history.dto';

test('commerce routes validate their bodies without a global pipe', () => {
  for (const controller of [
    CartController,
    CartHistoryController,
    SubscriptionController,
  ]) {
    const pipes = Reflect.getMetadata(PIPES_METADATA, controller) as unknown[];
    expect(pipes).toContain(ValidationPipe);
  }
});

test.each([
  { items: 'invalid' },
  { items: [{ artId: 1, quantity: 0 }] },
  { items: [{ artId: 1, quantity: 1 }], promoCode: 'FREE' },
])(
  'checkout rejects malformed quantities, collections and discounts',
  async (body) => {
    await expect(
      new ValidationPipe().transform(body, {
        type: 'body',
        metatype: CheckoutDto,
      }),
    ).rejects.toMatchObject({ status: 400 });
  },
);

test('order status updates reject values outside the supported lifecycle', async () => {
  await expect(
    new ValidationPipe().transform(
      { status: 'paid' },
      { type: 'body', metatype: UpdateStatusDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
});
