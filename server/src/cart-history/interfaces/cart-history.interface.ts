import { OrderLine, OrderPricing, OrderStatus } from '../cart-history.model';

export interface OrderHistoryItem extends Partial<Omit<OrderPricing, 'items'>> {
  items?: (Omit<OrderLine, 'price' | 'total'> & {
    price: number | null;
    total: number | null;
  })[];
  id: number;
  userId: number;
  artIds: number[];
  status: OrderStatus;
  createdAt: string;
}

export interface OrderHistoryResponse {
  items: OrderHistoryItem[];
  total: number;
}
