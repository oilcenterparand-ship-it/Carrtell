# Carrtell cart/payment/profile fix

Files in this patch:
- `src/pages/CartPage.tsx`
- `src/pages/PaymentPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/admin/services/ordersApi.ts`
- `src/App.tsx`

What it fixes:
- Cart page uses site theme colors.
- After order submission, user is redirected to `/payment/:orderId`.
- Payment page has a mock payment button and updates order status to `confirmed`.
- User dashboard/profile reads orders by phone and shows the last order.

No new SQL is required if `database/cart_orders.sql` was already executed.
