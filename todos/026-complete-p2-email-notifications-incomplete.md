---
status: complete
priority: p2
issue_id: "026"
tags: [email, notifications, communication, ux]
dependencies: []
---

# Email Notification System Incomplete

APPROVED - Only welcome email exists. No operational notifications.

## Problem Statement

Parents receive no email notifications for critical events:
- Registration confirmation
- Payment received
- Form submission acknowledgment
- Camp start reminders
- Incident alerts

Currently only `sendWelcomeEmail()` is implemented.

## Findings

**Current State:**
- Resend service is integrated (good foundation)
- React Email templates work
- Only welcome email template exists

**Missing Notifications:**
1. Registration confirmation
2. Payment received/failed
3. Form submission acknowledgment
4. Session reminder (1 week, 1 day before)
5. Incident notification to parents
6. Waitlist position updates
7. Spot available notification

## Proposed Solutions

### Option 1: Expand Email Service (Recommended)

**Create email templates for:**
```typescript
// src/lib/email/templates/
registration-confirmation.tsx
payment-received.tsx
form-submitted.tsx
session-reminder.tsx
incident-notification.tsx
waitlist-update.tsx
spot-available.tsx
```

**Create unified send function:**
```typescript
// src/lib/email/send.ts
export async function sendEmail(
  type: EmailType,
  to: string,
  data: EmailData
) {
  const template = templates[type];
  return resend.emails.send({
    from: 'Camp Name <no-reply@camp.com>',
    to,
    subject: template.subject(data),
    react: template.component(data),
  });
}
```

**Trigger points:**
- After `registerForSessionAction` - send confirmation
- After payment webhook - send receipt
- After `submitFormAction` - send acknowledgment
- Cron job for reminders

**Effort:** 8-12 hours
**Risk:** Low

### Option 2: Email Service Provider

Use SendGrid or Mailchimp for templating.

**Effort:** 12-16 hours
**Risk:** Medium (different API)

## Acceptance Criteria

- [ ] Registration triggers confirmation email
- [ ] Payment triggers receipt email
- [ ] Form submission triggers acknowledgment
- [ ] Session reminders sent 1 week before
- [ ] Incidents notify parents
- [ ] All emails have unsubscribe option
- [ ] Email templates are branded

## Technical Details

**New Files:**
- `src/lib/email/templates/registration-confirmation.tsx`
- `src/lib/email/templates/payment-received.tsx`
- `src/lib/email/templates/form-submitted.tsx`
- `src/lib/email/templates/session-reminder.tsx`
- `src/lib/email/templates/incident-notification.tsx`
- `src/lib/email/send.ts` (unified sender)

**Cron Job Needed:**
- Daily: check for upcoming sessions, send reminders
- (Vercel Cron or similar)

## Work Log

### 2025-12-22 - Initial Discovery

**By:** Missing Features Analysis Agent

**Actions:**
- Reviewed email infrastructure
- Identified missing notification types
- Documented template needs
- Estimated implementation effort
