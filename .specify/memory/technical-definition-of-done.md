# Technical Definition of Done (DoD)

Derived from `bookings/.specify/memory/constitution.md` (v1.6.0).

A work item is Done only when **all** gates below are satisfied.

## 1) Functional Completion

- [ ] All approved acceptance criteria implemented with no undocumented scope drift.
- [ ] Business rules and domain invariants enforced in code and tests.
- [ ] Feature behavior matches specification in normal, error, and edge paths.
- [ ] **i18n:** No hardcoded user-facing strings; all text uses the defined framework/keys.

## 2) Contract & Data Integrity

- [ ] Every API route change reflected in `spec/openapi.yaml` with accurate schemas.
- [ ] Input/output validation enforced with **Zod** at system boundaries.
- [ ] **Prisma:** `schema.prisma` is updated, migrations are generated, and SQL is reviewed for data loss/performance.
- [ ] **🤖 Prisma Sync:** `npx prisma validate` and `migrate status` pass (no schema drift).

## 3) Test Quality & CI Gates (NON-NEGOTIABLE)

- [ ] **🤖 CI Pass:** Full suite passes in CI with no flaky or quarantined tests.
- [ ] **🤖 Coverage:** Critical paths at 100%; overall unit coverage at/above project threshold.
- [ ] Unit tests cover all new/changed functions/components/hooks.
- [ ] Integration tests validate API, DB (Prisma), and external service interactions.
- [ ] E2E tests validate critical user journeys.
- [ ] BDD feature files, step definitions, smoke tests, and support code pass linting, static analysis, and pipeline validation with no special exemptions.
- [ ] Required GitHub Actions workflows are implemented, green, and wired into protected branch checks where applicable.

## 4) UI, Accessibility & Performance

- [ ] Storybook stories exist for each UI component (states, variants, edge cases).
- [ ] Accessibility passes WCAG 2.2 AA checks (automated + manual keyboard/screen-reader).
- [ ] Lighthouse Accessibility score is ≥ 95.
- [ ] **🤖 Performance:** Bundle size impact analyzed via CI; significant increases justified or code-split.
- [ ] Responsive verification covers mobile, tablet, desktop, keyboard-only, and touch interactions for affected critical journeys.
- [ ] Failure states are graceful, accessible, and provide clear recovery guidance.

## 5) Code Quality & Maintainability

- [ ] Local hooks, where present, pass; CI remains the authoritative merge and release gate.
- [ ] Code follows functional requirements (no class-based architecture).
- [ ] Functions/modules remain small, composable, and single-purpose.
- [ ] Production code contains no dead code, commented-out code, or debug logging.

## 6) Observability, Reliability & Security

- [ ] Structured logs (JSON) and actionable errors present for key flows.
- [ ] Retry/backoff/cancellation behaviors implemented where required.
- [ ] **Container Hygiene:** Image is scanned for vulnerabilities; multi-stage builds used; runs as non-root.
- [ ] **Orchestration:** Liveness/Readiness probes and resource limits (CPU/Mem) are defined.
- [ ] Containerised runtime verification confirms the web app, worker, and required backing services operate together for the relevant environment.
- [ ] User-facing errors are sanitized, minimally informative, and free of secrets or sensitive operational detail.

## 7) Documentation & Release Readiness

- [ ] Documentation updated (`README`, `docs/`, `specs/`, API contracts).
- [ ] Operational notes, DB seeding changes, and configuration (Env vars) documented.
- [ ] Versioning impact assessed and release notes prepared.
- [ ] **🤖 Preview:** Deployment verified in a containerised staging/preview environment.
- [ ] Reviewer approval complete and all DoD evidence attached to the PR.
- [ ] Local development startup guidance is updated when runtime or environment setup changes.
- [ ] Non-production seeded admin credential policy is documented where applicable.
- [ ] Mermaid architecture and data-model diagrams are updated for major platform changes.
- [ ] Production readiness checklist is updated and attached where relevant.
- [ ] First-payments readiness checklist is completed before any work is declared ready for live payment collection.

## Done Decision

A story is **Done** only when every checkbox is complete.
Any exception requires explicit written approval and a follow-up remediation task.
