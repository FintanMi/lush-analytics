# Stripe Payment Setup Guide

## Overview

The Lush Analytics application uses Stripe for payment processing. A placeholder Stripe secret key has been added to Supabase secrets, but you need to replace it with your actual Stripe secret key.

## Setup Instructions

### 1. Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

### 2. Update Supabase Secret

You have two options to update the Stripe secret key:

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Find the `STRIPE_SECRET_KEY` secret
4. Click **Edit** and replace the placeholder value with your actual Stripe secret key
5. Click **Save**

#### Option B: Using Supabase CLI

```bash
# Set the secret using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=your_actual_stripe_secret_key_here
```

### 3. Verify the Setup

After updating the secret key:

1. Restart your edge functions (if running locally)
2. Test the payment flow by clicking "Subscribe Now" on any pricing tier
3. You should be redirected to a Stripe checkout page

## Current Placeholder Value

The current placeholder value is:
```
sk_test_placeholder_replace_with_actual_stripe_key
```

**⚠️ Important**: This placeholder will cause payment errors. You must replace it with a valid Stripe secret key.

## Testing Payments

### Test Mode

For testing, use Stripe's test mode:

1. Use test secret key (starts with `sk_test_`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC

### Production Mode

For production:

1. Use live secret key (starts with `sk_live_`)
2. Ensure your Stripe account is fully activated
3. Configure webhook endpoints in Stripe dashboard

## Troubleshooting

### Error: "Payment system not configured"

This error occurs when:
- The Stripe secret key is not set
- The secret key is invalid
- The secret key is still the placeholder value

**Solution**: Follow the setup instructions above to set a valid Stripe secret key.

### Error: "Edge function returned a non 2xx status code"

This error has been fixed in the latest update. The edge function now returns proper error messages in the response body.

## Security Notes

- Never commit your Stripe secret key to version control
- Use test keys for development and testing
- Use live keys only in production
- Rotate keys regularly for security
- Monitor your Stripe dashboard for suspicious activity

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
