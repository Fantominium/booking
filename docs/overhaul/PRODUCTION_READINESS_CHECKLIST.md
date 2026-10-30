# Production Readiness Checklist

## Purpose

Use this checklist before declaring the platform ready for production deployment.

## Governance And Planning

- [ ] Governing documents are up to date and approved
- [ ] Overhaul specification, plan, and tasks are current
- [ ] Required release artifacts are attached to the release decision

## Code Quality And Pipeline

- [ ] GitHub Actions required workflows are implemented
- [ ] Linting passes
- [ ] Type validation passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Contract and security checks pass
- [ ] E2E tests pass
- [ ] Smoke tests pass
- [ ] BDD feature support code passes the same quality gates as application code

## Containerisation And Runtime Topology

- [ ] Web app container builds successfully
- [ ] Worker container builds successfully
- [ ] Required supporting services are included in the runtime topology
- [ ] Healthchecks are defined and verified
- [ ] Whole-system runtime verification passes in a containerised environment
- [ ] Image scan results are reviewed

## UX, Accessibility, And Responsiveness

- [ ] WCAG 2.2 AA checks pass
- [ ] Lighthouse accessibility target is met
- [ ] Critical journeys are verified on mobile, tablet, and desktop
- [ ] Keyboard-only and touch interactions are verified for critical journeys
- [ ] Graceful-failure behavior is verified for critical customer and admin flows
- [ ] User-facing failures are sanitized and minimally informative

## Environment And Operations

- [ ] Bank-transfer-only production environment variables are configured through a secret store; Stripe values are absent and not required
- [ ] Secrets are managed through the hosting or deployment secret store
- [ ] PostgreSQL and Redis are isolated on private infrastructure; paid managed database services are out of scope
- [ ] Production web and worker containers run non-root with restricted ports and verified health checks
- [ ] Database migrations have been reviewed and are ready for production use
- [ ] PostgreSQL backup restore drill is attached and meets approved RPO/RTO
- [ ] Worker, queue age, email delivery, database, and Redis alert delivery is demonstrated
- [ ] Rollback approach is documented
- [ ] Preview or staging verification has completed successfully
- [ ] Operational owners are identified for release approval

## Documentation

- [ ] README and relevant docs are updated
- [ ] Local development bootstrap guidance is current
- [ ] Architecture and data-model documentation is current
- [ ] Release notes or release summary is prepared

## Approval

- [ ] Engineering approval complete
- [ ] QA or test approval complete
- [ ] Product or business approval complete where required
- [ ] Release evidence attached to the decision record
- [ ] Route-to-scenario matrix has no unmapped route or outcome branch
- [ ] Stripe deferral is acknowledged; card, PaymentIntent, webhook, and refund readiness are not release gates
