# Paysera Recurring Payments

This document describes the implementation of recurring payments using Paysera in the Solis application.

## Overview

The recurring payment system allows users to opt-in for automatic subscription renewals. When enabled, the system will automatically process payments for subscriptions that are about to expire, ensuring uninterrupted service for users.

## Components

The implementation consists of the following components:

1. **PayseraService** (`lib/services/paysera.ts`): Handles communication with the Paysera API, including creating payments, authorizing recurring payments, and capturing payments.

2. **Webhook Handler** (`app/api/webhooks/paysera/route.ts`): Processes payment notifications from Paysera, updating order status and user subscriptions.

3. **Recurring Payment Processor** (`scripts/process-recurring-payments.ts`): A script that runs as a scheduled task to process recurring payments for subscriptions that are about to expire.

4. **Cron Job Script** (`scripts/cron-jobs.sh`): A shell script that can be scheduled to run the recurring payment processor.

## Database Structure

The implementation uses the following database tables:

- `user_payment_profiles`: Stores user subscription information, including the subscription end date and recurring payment flag.
- `payment_tokens`: Stores payment tokens for recurring payments.
- `payment_orders`: Records payment orders and their status.
- `access_tiers`: Defines subscription tiers and their prices.

## Setting Up Recurring Payments

### Environment Variables

Ensure the following environment variables are set:

```
NEXT_PUBLIC_PAYSERA_PROJECT_ID=your_project_id
PAYSERA_PASSWORD=your_password
PAYSERA_SIGN_PASSWORD=your_sign_password
NEXT_PUBLIC_APP_URL=your_app_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Scheduling the Recurring Payment Processor

To schedule the recurring payment processor to run daily, add the following to your crontab:

```
0 0 * * * /path/to/your/app/scripts/cron-jobs.sh
```

This will run the script every day at midnight.

## Flow for Recurring Payments

1. **Initial Payment**:
   - User selects a subscription tier and opts in for recurring payments.
   - The system creates a payment order and redirects the user to Paysera for payment.
   - After successful payment, Paysera sends a notification to the webhook handler.
   - The webhook handler updates the order status and user subscription.
   - The system stores the payment token for future recurring payments.

2. **Recurring Payment**:
   - The recurring payment processor runs daily, checking for subscriptions that are about to expire.
   - For each subscription with recurring payments enabled, the system:
     - Creates a new payment order.
     - Authorizes a payment using the stored payment token.
     - Captures the payment.
     - Updates the subscription end date.

## Testing

To test the recurring payment system:

1. Create a test user with a subscription and recurring payments enabled.
2. Set the subscription end date to a date within the next 3 days.
3. Run the recurring payment processor script:

```
ts-node scripts/process-recurring-payments.ts
```

4. Check the logs for any errors and verify that the subscription end date has been updated.

### Automated Test Setup

For convenience, a test script is provided to set up a test environment:

```
ts-node scripts/test-recurring-payments.ts
```

This script:
- Creates a test user with a random email
- Assigns a subscription tier to the user
- Sets up a user payment profile with a subscription end date 3 days from now
- Creates a test payment token
- Enables recurring payments for the user

After running this script, you can run the recurring payment processor to test the system.

## Troubleshooting

If you encounter issues with recurring payments:

1. Check the logs for error messages.
2. Verify that the environment variables are set correctly.
3. Ensure that the payment tokens are valid and not expired.
4. Check the Paysera dashboard for payment status and errors. 