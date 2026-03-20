# Technical Definition of Ready (DoR) - v2.0.0

Derived from `bookings/.specify/memory/constitution.md` and industry best practices (Scrum Alliance/INVEST).

A work item is **Ready** for selection into a Sprint only when the following gates are satisfied through collaborative refinement.

## 1) Core Agile Foundation (INVEST)

- **Independent:** The story is independently implementable and deployable (no hidden coupling).
- **Negotiable:** The specification is a "placeholder for conversation," not a rigid contract.
- **Valuable:** Business value is clear, P1/P2/P3 priority is assigned with sequencing rationale.
- **Estimable:** The team has enough context to provide a reliable effort estimate.
- **Small:** Item is sized to fit comfortably within a single sprint (S.M.A.R.T.).
- **Testable:** Acceptance criteria are explicit, testable, and mapped to user outcomes.

## 2) Architecture & Interfaces

- [ ] API changes identified; contract-first updates prepared in `spec/openapi.yaml`.

- [ ] Data model impact defined (Prisma schema and migration plan).
- [ ] Domain invariants documented (single-service booking/anti-double-booking constraints).
- [ ] Idempotency strategy defined for booking/payment creation paths.
- [ ] Required GitHub Actions jobs, required statuses, and failure thresholds are defined before implementation starts.
- [ ] Container topology and environment-parity strategy are defined for the web app, worker, and backing services.

## 3) Test-First Plan (NON-NEGOTIABLE)

- [ ] Red-phase tests defined before coding (unit, integration, E2E scope).

- [ ] Success, failure, and edge cases listed per acceptance criterion.
- [ ] Test data/fixtures and mocking strategy documented.
- [ ] Critical path tests identified for 100% coverage.
- [ ] Smoke-test scope for deployment-critical flows is identified.
- [ ] BDD scenarios, step definitions, and support code are designed to satisfy the same linting, static analysis, and pipeline quality standards as application code.

## 4) Accessibility & UX Readiness

- [ ] **UX Alignment:** Wireframes/mockups are reviewed and understood by the team.

- [ ] WCAG 2.2 AA requirements captured in acceptance criteria.
- [ ] Keyboard navigation, screen-reader behavior, and responsive breakpoints specified.
- [ ] Touch target and contrast requirements explicitly included.
- [ ] Graceful-failure UX is specified for validation, timeout, retry, degraded-service, and recovery states.

## 5) Observability, Errors & Security

- [ ] Structured logging points defined (key events, failures, correlation context).

- [ ] Error handling strategy specified using typed/result-oriented patterns.
- [ ] Security/compliance impact assessed (payments, PII, secret handling).
- [ ] Rollback/failure mode expectations documented.
- [ ] User-visible disclosure policy is defined so sensitive operational detail remains in logs and operator tooling only.

## 6) Dependencies & Technical Constraints

- [ ] **External Blockers:** All external dependencies are identified and resolved.

- [ ] Solution aligns with mandatory stack (Next.js, TS strict, pnpm, Prisma, Zod, Stripe).
- [ ] Functional programming constraints respected (no class-based architecture).
- [ ] Implementation approach keeps functions small and single-purpose.

## 7) Delivery Artifacts & Ownership

- [ ] Implementation tasks created and traceable to acceptance criteria.

- [ ] Documentation updates required at completion identified upfront.
- [ ] Risks, assumptions, and out-of-scope items documented.
- [ ] **Team Buy-in:** The team has collectively reviewed the item in a refinement session.
- [ ] Required platform artifacts are identified up front where relevant: local startup guide, seeded local admin policy, Mermaid architecture/data diagrams, production readiness checklist, and first-payments checklist.
- [ ] Governance-impact assessment completed for work likely to establish new reusable standards.

---

**Ready Decision:** A story is Ready only when the team agrees it meets these criteria. Exceptions require explicit approval and a tracked follow-up task.
