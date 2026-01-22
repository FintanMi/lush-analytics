# Stripe Payment Integration Setup Guide

## Overview
Lush Analytics now includes full Stripe payment integration for subscription management. This guide will help you configure Stripe to enable payment processing.

## Prerequisites
- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard
- Supabase project (already configured)

## Step 1: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/apikeys
2. Sign in to your Stripe account
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)
4. Copy your **Secret key** (click "Reveal test key" if in test mode)

⚠️ **Important**: 
- Use **test keys** (starting with `sk_test_`) for development
- Use **live keys** (starting with `sk_live_`) only for production
- Never commit secret keys to version control

## Step 2: Add Stripe Secret Key to Supabase

You need to add your Stripe secret key as an environment variable in Supabase Edge Functions.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Click on **Secrets** or **Environment Variables**
4. Add a new secret:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (e.g., `sk_test_...`)
5. Click **Save**

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

## Step 3: Test the Integration

1. Go to your Lush Analytics landing page
2. Click on any paid pricing tier (Basic, Premium, or Business)
3. You should be redirected to a Stripe checkout page
4. Use Stripe test card numbers to test payments:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code (e.g., 12345)

## Step 4: Verify Payment Processing

After completing a test payment:
1. You should be redirected to the payment success page
2. A success notification should appear for 5 seconds
3. The order should be recorded in your Supabase `orders` table
4. Check your Stripe Dashboard to see the test payment

## Pricing Tiers

The following subscription tiers are configured:

| Tier | Price | Description |
|------|-------|-------------|
| Free | €0 | Perfect for getting started |
| Basic | €50/month | For growing businesses |
| Premium | €300/month | For established companies |
| Business | €1200/month | For enterprise scale |

## Payment Flow

1. **User clicks "Subscribe Now"** on a pricing tier
2. **Frontend calls** `create_stripe_checkout` Edge Function
3. **Edge Function creates**:
   - A pending order in the database
   - A Stripe checkout session
4. **User is redirected** to Stripe's hosted checkout page (opens in new tab)
5. **User completes payment** on Stripe
6. **Stripe redirects** back to `/payment-success?session_id=...`
7. **Frontend calls** `verify_stripe_payment` Edge Function
8. **Edge Function verifies** payment with Stripe API
9. **Order status updated** to "completed" in database
10. **Success notification** displayed for 5 seconds

## Database Schema

The `orders` table stores all payment transactions:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  items JSONB NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status order_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Functions

Two Edge Functions handle payment processing:

### 1. create_stripe_checkout
- **Purpose**: Creates a Stripe checkout session
- **Input**: Pricing tier details
- **Output**: Stripe checkout URL
- **Location**: `supabase/functions/create_stripe_checkout/index.ts`

### 2. verify_stripe_payment
- **Purpose**: Verifies payment completion
- **Input**: Stripe session ID
- **Output**: Payment verification result
- **Location**: `supabase/functions/verify_stripe_payment/index.ts`

## Troubleshooting

### Error: "STRIPE_SECRET_KEY not configured"
- **Solution**: Follow Step 2 to add your Stripe secret key to Supabase

### Payment page doesn't open
- **Check**: Browser popup blocker settings
- **Check**: Console for JavaScript errors
- **Check**: Network tab for failed API calls

### Payment verification fails
- **Check**: Stripe secret key is correct
- **Check**: Using the correct Stripe account (test vs. live)
- **Check**: Edge Functions are deployed successfully

### Orders not appearing in database
- **Check**: Database permissions (RLS policies)
- **Check**: Edge Function logs in Supabase dashboard
- **Check**: Stripe webhook configuration (if using webhooks)

## Security Notes

✅ **Good Practices**:
- Secret keys are stored in Supabase environment variables
- Payment processing happens server-side in Edge Functions
- Client never has access to secret keys
- All payment verification is done server-side

❌ **Never Do**:
- Commit secret keys to Git
- Expose secret keys in frontend code
- Trust payment amounts from the client
- Skip server-side verification

## Going Live

When ready for production:

1. **Switch to live Stripe keys**:
   - Get your live secret key from Stripe Dashboard
   - Update `STRIPE_SECRET_KEY` in Supabase to use `sk_live_...`

2. **Test thoroughly**:
   - Test all pricing tiers
   - Test payment success and failure flows
   - Verify order creation and status updates

3. **Enable Stripe webhooks** (optional but recommended):
   - Set up webhooks in Stripe Dashboard
   - Handle events like `checkout.session.completed`
   - Provides additional payment confirmation

4. **Monitor**:
   - Check Stripe Dashboard regularly
   - Monitor Supabase Edge Function logs
   - Set up alerts for failed payments

## Support

For issues related to:
- **Stripe**: https://support.stripe.com
- **Supabase**: https://supabase.com/docs
- **Lush Analytics**: Check application logs and console

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
