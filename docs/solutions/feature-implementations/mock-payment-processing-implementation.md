---
title: Mock Payment Processing - Development and Demo Checkout Flow
category: feature-implementations
tags: [payment, mock, revenue, checkout, testing, server-actions]
severity: high
date_solved: 2025-12-22
components: [src/app/(public)/checkout/[registrationId]/page.tsx, src/app/(public)/checkout/[registrationId]/confirmation/page.tsx, src/components/checkout/checkout-form.tsx, src/app/actions/checkout-actions.ts]
symptoms: >-
  Registration system completed form submission but had no way to process payments. Registrations stayed
  in "pending" status indefinitely. No checkout page, no payment UI, no confirmation flow. Registration
  workflow was incomplete.
root_cause: >-
  Payment processing was deferred to post-MVP due to complexity of real payment gateway integration.
  Mock implementation was not prioritized until demo readiness requirements became critical.
---

# Mock Payment Processing System

## Overview

Complete checkout flow that simulates payment processing for development and demos:
- Checkout page with order summary
- Mock payment form (pre-filled, disabled inputs)
- Payment processing with status update
- Confirmation page with next steps

## Implementation

### 1. Server Actions

Created `src/app/actions/checkout-actions.ts`:

```typescript
export async function processPaymentAction(data: {
  registrationId: string;
  amount: string;
}) {
  // Verify ownership
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.id, data.registrationId),
    with: { session: true },
  });

  if (registration.userId !== session.user.id) {
    return { success: false, error: "You can only pay for your own registrations" };
  }

  // Verify amount matches
  if (data.amount !== registration.session.price) {
    return { success: false, error: "Payment amount mismatch" };
  }

  // Process mock payment
  const [updated] = await db.transaction(async (tx) => {
    const [updatedReg] = await tx
      .update(registrations)
      .set({
        status: "confirmed",
        amountPaid: data.amount,
      })
      .where(eq(registrations.id, data.registrationId))
      .returning();

    // Log event for audit trail
    await tx.insert(events).values({
      streamId: `registration-${data.registrationId}`,
      eventType: "MockPaymentProcessed",
      eventData: {
        registrationId: data.registrationId,
        amount: data.amount,
        paymentMethod: "mock",
        processedAt: new Date().toISOString(),
      },
      version: 1,
      userId: session.user.id,
    });

    return [updatedReg];
  });

  return { success: true, registration: updated };
}
```

### 2. Checkout Page

Created `src/app/(public)/checkout/[registrationId]/page.tsx`:

- Validates user owns the registration
- Redirects to confirmation if already paid
- Displays order summary and checkout form

### 3. Checkout Form Component

Created `src/components/checkout/checkout-form.tsx`:

- Order summary with session and child details
- Mock credit card form (disabled, pre-filled with test values)
- Demo mode banner explaining no real payment
- Processing state with spinner
- Error handling

### 4. Confirmation Page

Created `src/app/(public)/checkout/[registrationId]/confirmation/page.tsx`:

- Success message with checkmark
- Registration details
- Amount paid
- "What's Next" guidance
- Link back to dashboard

### 5. Parent Dashboard Integration

Added "Pay Now" button to pending registrations:

```tsx
{registration.amountPaid ? (
  <p className="text-sm text-green-600">Paid</p>
) : registration.status === "pending" ? (
  <Link href={`/checkout/${registration.id}`}>
    <Button size="sm" className="mt-2">
      Pay Now
      <ArrowRight className="h-4 w-4 ml-1" />
    </Button>
  </Link>
) : null}
```

## User Flow

```
Parent Dashboard → Register for Session → Registration (Pending)
                                              ↓
                                         "Pay Now" button
                                              ↓
                                      /checkout/[id] page
                                              ↓
                                    Order Summary + Mock Form
                                              ↓
                                      Click "Pay Now"
                                              ↓
                                  1.5s simulated processing
                                              ↓
                               /checkout/[id]/confirmation
                                              ↓
                                   Registration Confirmed!
```

## Future: Stripe Integration

When ready for production payments, replace mock with:

```typescript
// In processPaymentAction
const stripeSession = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: registration.session.name },
      unit_amount: Math.round(parseFloat(registration.session.price) * 100),
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${baseUrl}/checkout/${registrationId}/confirmation`,
  cancel_url: `${baseUrl}/checkout/${registrationId}`,
  metadata: { registrationId },
});

return { success: true, checkoutUrl: stripeSession.url };
```

Then handle webhook at `/api/webhooks/stripe` to update registration status.
