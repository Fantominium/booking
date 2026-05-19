# First Payments Readiness Checklist

## Purpose

Use this checklist before enabling or accepting the first live production payments.

This checklist is stricter than ordinary production readiness because revenue operations, support, and rollback expectations must be proven explicitly.

## Payment Configuration

- [ ] Live payment provider credentials are configured securely
- [ ] Test-mode and live-mode configurations are clearly separated
- [ ] Payment provider environment has been reviewed by an authorized owner
- [ ] Webhook endpoint path and secret configuration are verified

## Payment Flow Validation

- [ ] Payment intent or equivalent authorization flow has been tested in the target environment
- [ ] Successful payment confirmation flow has been verified end to end
- [ ] Failed payment flow has been verified end to end
- [ ] Refund flow has been verified end to end
- [ ] Booking conflict and refund behavior has been verified where applicable
- [ ] Admin observability of payment states is verified

## Security And Error Disclosure

- [ ] User-facing payment failures are minimally informative and sanitized
- [ ] Sensitive provider or infrastructure detail is visible only in logs or operator tooling
- [ ] Secret handling and access controls are reviewed
- [ ] Payment-related logs and audit trails are present and verifiable

## Operational Readiness

- [ ] Support or business owners know how to identify and respond to payment failures
- [ ] Refund and incident handling steps are documented
- [ ] Rollback or payment-disable plan exists
- [ ] Monitoring and alerting expectations are defined
- [ ] Operator contacts and escalation paths are documented

## Evidence And Approval

- [ ] Relevant GitHub Actions pipeline evidence is attached
- [ ] Smoke and environment verification evidence is attached
- [ ] Payment flow validation evidence is attached
- [ ] Engineering signoff is complete
- [ ] Business or release-owner signoff is complete

## Final Gate

- [ ] Live payment collection is not enabled until every required item above is complete or an explicit, documented waiver is approved
