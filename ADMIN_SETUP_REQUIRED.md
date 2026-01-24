# ⚠️ ADMIN SETUP REQUIRED - Stripe Payment Configuration

## Current Status
🔴 **Payment system is NOT functional** - Placeholder API key is active

## What Needs to Be Done

The application is currently using a placeholder Stripe API key that will cause payment errors. To enable payment processing, you must configure a real Stripe secret key.

---

## Quick Setup Guide (5 minutes)

### Step 1: Get Your Stripe Secret Key

1. **Sign up for Stripe** (if you don't have an account):
   - Go to https://stripe.com
   - Click "Sign up" and complete registration
   - Verify your email address

2. **Get your API key**:
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com)
   - Click **Developers** in the left sidebar
   - Click **API keys**
   - Find your **Secret key** in the "Standard keys" section
   - Click **Reveal test key** to see it
   - Copy the key (it starts with `sk_test_` for test mode)

**Example of what a real key looks like:**
```
sk_test_51Qz1234567890abcdefghijklmnopqrstuvwxyzABCDEF
```

### Step 2: Update Supabase Secret

1. **Go to your Supabase Dashboard**:
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Secrets**:
   - Click **Settings** (gear icon in left sidebar)
   - Click **Edge Functions**
   - Click **Secrets** tab

3. **Update the STRIPE_SECRET_KEY**:
   - Find `STRIPE_SECRET_KEY` in the list
   - Click the **Edit** button (pencil icon)
   - Replace the placeholder value with your actual Stripe secret key
   - Click **Save**

### Step 3: Verify It Works

1. **Test the payment flow**:
   - Go to your application's landing page
   - Click "Subscribe Now" on any paid tier
   - You should be redirected to a Stripe checkout page

2. **Use Stripe test cards** (for test mode):
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any valid code (e.g., `12345`)

3. **Verify success**:
   - Complete the test payment
   - Check that you're redirected back to the application
   - Verify the payment appears in your Stripe Dashboard

---

## Current Error Messages

Users will see these errors until you configure the real API key:

- ❌ "Configuration Error: Payment system requires configuration"
- ❌ "Invalid API Key provided: sk_test_51QzPlaceholder..."
- ❌ "Setup Required: Payment processing is not yet configured"

---

## Test Mode vs Live Mode

### Test Mode (Recommended First)
- Use keys starting with `sk_test_`
- No real money is charged
- Use Stripe test card numbers
- Perfect for development and testing

### Live Mode (Production)
- Use keys starting with `sk_live_`
- Real money is charged
- Requires full Stripe account activation
- Only use after thorough testing

**⚠️ Important**: Always test with test mode keys first!

---

## Stripe Test Cards Reference

| Scenario | Card Number | Result |
|----------|-------------|--------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient Funds | 4000 0000 0000 9995 | Insufficient funds |
| 3D Secure Required | 4000 0025 0000 3155 | Requires authentication |
| Expired Card | 4000 0000 0000 0069 | Expired card |

**For all test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid postal code

---

## Security Best Practices

### ✅ DO:
- Keep your secret key confidential
- Use test keys for development
- Rotate keys periodically
- Monitor Stripe Dashboard for suspicious activity
- Use HTTPS for all endpoints

### ❌ DON'T:
- Commit secret keys to version control
- Share keys in chat/email
- Use live keys in development
- Expose keys in frontend code
- Use the same key across multiple projects

---

## Troubleshooting

### Problem: "Invalid API Key provided"
**Cause**: The key format is incorrect or contains extra characters

**Solution**:
1. Verify the key starts with `sk_test_` or `sk_live_`
2. Check for extra spaces before/after the key
3. Make sure you copied the entire key
4. Try revealing and copying the key again from Stripe Dashboard

### Problem: "STRIPE_SECRET_KEY not configured"
**Cause**: The secret is not set in Supabase

**Solution**:
1. Follow Step 2 above to add the secret
2. Make sure you clicked "Save"
3. Wait 30 seconds for the change to propagate
4. Try the payment flow again

### Problem: Payment succeeds but user subscription not updated
**Cause**: Webhook not configured

**Solution**:
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://[your-project-ref].supabase.co/functions/v1/verify_stripe_payment`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy the signing secret (starts with `whsec_`)
6. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### Problem: Payments work in test mode but not live mode
**Cause**: Stripe account not fully activated

**Solution**:
1. Complete Stripe account activation
2. Provide business information
3. Verify your bank account
4. Wait for Stripe approval (usually instant)

---

## Pricing Tiers

The application currently offers these subscription tiers:

| Tier | Price | Features |
|------|-------|----------|
| Starter | €29/month | 10K events, Basic analytics, Email support |
| Professional | €99/month | 100K events, Advanced analytics, Priority support |
| Enterprise | €299/month | Unlimited events, Custom integrations, SLA |

---

## Additional Configuration (Optional)

### Webhook Setup for Production

For production deployments, configure webhooks to handle payment events:

1. **Create webhook endpoint**:
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://[your-project].supabase.co/functions/v1/verify_stripe_payment`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Add webhook secret**:
   - Copy the signing secret from Stripe
   - Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### Custom Domain (Optional)

If you want to use a custom domain for Stripe checkout:

1. Configure your domain in Stripe Dashboard
2. Update success/cancel URLs in the edge function
3. Add domain to Stripe's allowed domains list

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing Guide**: https://stripe.com/docs/testing
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Application Docs**: See `docs/stripe-setup.md` for detailed setup

---

## Checklist

Before marking this as complete, verify:

- [ ] Stripe account created and verified
- [ ] Secret key copied from Stripe Dashboard
- [ ] `STRIPE_SECRET_KEY` updated in Supabase
- [ ] Test payment completed successfully
- [ ] Payment appears in Stripe Dashboard
- [ ] User redirected correctly after payment
- [ ] Error messages no longer appear
- [ ] (Optional) Webhooks configured for production
- [ ] (Optional) Live mode tested with real card

---

## Questions?

If you encounter issues:

1. Check the browser console for detailed error messages
2. Review Stripe Dashboard logs (Developers → Logs)
3. Check Supabase Edge Function logs
4. Verify all steps above were completed correctly
5. Contact Stripe Support if needed

---

**Last Updated**: 2026-01-21  
**Priority**: 🔴 HIGH - Required for payment functionality  
**Estimated Time**: 5-10 minutes
