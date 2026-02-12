# PCI-DSS SAQ-A Checklist

**Project**: TruFlow Booking Platform
**Scope**: SAQ-A (card-not-present with third-party payment processor)

## Controls

- [x] Payment data handled by Stripe Elements (no card data stored)
- [x] No PAN, CVV, or cardholder data stored in application database
- [x] Webhook signatures validated for payment events
- [x] TLS required for production traffic
- [x] Access to secrets restricted to environment variables
- [x] Audit logs contain no sensitive payment data

## Evidence

- Stripe Elements usage in `src/components/payment/StripePaymentForm.tsx`
- No card data fields present in `prisma/schema.prisma`
- Webhook verification in `src/app/api/webhooks/stripe/[token]/route.ts`

## Notes

- SAQ-A assumes all payment card data is handled by Stripe.
- Annual review required.
