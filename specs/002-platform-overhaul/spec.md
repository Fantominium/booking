# Feature Specification: Platform Overhaul Foundation

**Feature Branch**: `002-platform-overhaul`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User direction to formalize the platform overhaul with governance amendments, GitHub Actions CI/CD, full application containerisation, local development bootstrap documentation, detailed UX/accessibility/failure requirements, Mermaid architecture and data-diagram deliverables, BDD quality requirements, and release/first-payments readiness gates.

## Clarifications

### Session 2026-03-19

- Q: Is this feature intended to deliver the full rebuilt product? → A: No. This feature establishes the governed foundation, documentation, and delivery controls that must exist before the wider platform overhaul proceeds.
- Q: Must BDD artifacts meet the same quality bar as application code? → A: Yes. BDD feature files, step definitions, fixtures, and helpers must pass linting and the pipeline checks that replace local pre-commit enforcement.
- Q: Should local admin credentials remain available in production? → A: No. Seeded credentials are local/test-only and must never be part of the production bootstrap path.
- Q: Are Mermaid architecture and data diagrams immediate deliverables or later implementation artifacts? → A: They are required platform-overhaul artifacts and must be planned and documented now, then updated as implementation evolves.

## User Scenarios & Testing

### User Story 1 - Platform Work Starts Under Explicit Governance (Priority: P1)

As a project owner, I want the platform overhaul to be governed by updated standards and release gates so that implementation cannot drift outside the agreed quality bar.

**Why this priority**: Without governance alignment, later implementation work will either violate the current rules or bypass them informally.

**Independent Test**: Review the amended governance documents and confirm the constitution, Definition of Ready, and Definition of Done explicitly cover the pipeline, containerisation, documentation artifacts, graceful failures, and first-payments readiness.

**Acceptance Scenarios**:

1. **Given** the platform overhaul is being planned, **when** the team reviews the governing documents, **then** GitHub Actions CI/CD, full application containerisation, local startup docs, Mermaid diagrams, and release checklists are explicitly required artifacts.
2. **Given** the project introduces BDD scenarios and smoke tests, **when** quality expectations are reviewed, **then** those artifacts are held to the same linting and pipeline quality standards as application code.
3. **Given** the overhaul introduces new best practices, **when** those practices are validated as reusable, **then** the governance docs require them to be folded back into the standards.

---

### User Story 2 - Local Development Startup Is Clear And Repeatable (Priority: P1)

As a developer, I want complete local startup instructions, environment setup guidance, and safe sample credentials so that I can run the app locally without tribal knowledge.

**Why this priority**: Developer setup is a prerequisite for implementation, testing, CI parity, and operational clarity.

**Independent Test**: Follow the local development guide on a clean machine or containerised environment and verify the app, worker, database, and Redis can be started and used with local/test credentials only.

**Acceptance Scenarios**:

1. **Given** a developer has cloned the repository, **when** they follow the local development bootstrap document, **then** they can install dependencies, configure environment variables, start the database and Redis, run migrations, seed data, and start the app and worker successfully.
2. **Given** the local seed flow creates a test admin user, **when** the documentation is reviewed, **then** it explicitly states that the seeded credentials are local/test-only and unavailable in production.
3. **Given** a developer hits a setup problem, **when** they consult the bootstrap document, **then** troubleshooting guidance exists for missing environment variables, failed migrations, unavailable Redis, and webhook configuration issues.

---

### User Story 3 - CI/CD And Containerisation Become Delivery Requirements (Priority: P1)

As a technical lead, I want the planned GitHub Actions pipeline and full application containerisation defined as required work so that the platform can be validated consistently from local development through release.

**Why this priority**: Pipeline and runtime topology are now core product-quality controls, not optional infrastructure work.

**Independent Test**: Review the overhaul plan and tasks and confirm they require GitHub Actions workflow delivery, containerised runtime topology, smoke verification, and preview/staging parity.

**Acceptance Scenarios**:

1. **Given** the overhaul specification is reviewed, **when** CI/CD requirements are checked, **then** GitHub Actions is named as the mandatory control plane for validation, scanning, preview verification, and release gating.
2. **Given** runtime topology requirements are reviewed, **when** containerisation expectations are checked, **then** the web app, worker, and required backing services are all covered.
3. **Given** smoke verification requirements are reviewed, **when** deployment-critical flows are identified, **then** those flows are explicitly planned as smoke checks in the pipeline.

---

### User Story 4 - UX, Accessibility, And Failure Quality Are Specified Up Front (Priority: P1)

As a product and engineering team, we want accessibility, responsiveness, user friendliness, and graceful failure behavior defined before implementation so that the overhaul improves the user experience rather than just changing infrastructure.

**Why this priority**: The platform will handle sensitive booking and payment flows. Poor failure handling or weak accessibility would undermine trust.

**Independent Test**: Review the functional requirements and verify they define mobile-first responsiveness, accessibility expectations, failure-state behavior, and sanitized user-visible errors.

**Acceptance Scenarios**:

1. **Given** the overhaul functional requirements are reviewed, **when** UX requirements are checked, **then** responsive behavior, touch targets, keyboard access, screen-reader behavior, and clear navigation expectations are all defined.
2. **Given** failure behavior requirements are reviewed, **when** degraded, timeout, retry, and validation states are examined, **then** they require graceful, actionable, minimally informative user-facing messaging.
3. **Given** support and security needs are reviewed, **when** error disclosure expectations are checked, **then** sensitive operational details are confined to logs and operator tooling rather than user-facing responses.

---

### User Story 5 - Release And First-Payments Readiness Are Governed (Priority: P1)

As a release owner, I want explicit production-readiness and first-payments readiness checklists so that the platform cannot be declared ready for release or live payments without evidence.

**Why this priority**: Live payment collection is a business and operational threshold that requires stronger control than normal feature completion.

**Independent Test**: Review the release-checklist documents and verify they cover release quality, environment readiness, payment verification, rollback readiness, and operator readiness.

**Acceptance Scenarios**:

1. **Given** production readiness is being reviewed, **when** the checklist is used, **then** it covers quality gates, environment configuration, container health, release evidence, accessibility, and operational readiness.
2. **Given** first live payments are being considered, **when** the first-payments checklist is used, **then** it covers payment sandbox signoff, webhook verification, refund-path verification, admin observability, support readiness, and rollback planning.
3. **Given** a release is approaching, **when** evidence is gathered, **then** there is a defined expectation for attaching checklist results and pipeline evidence to the release decision.

## Edge Cases

- Governance changes are proposed but not applied: overhaul implementation must not start until the required amendments are approved or explicitly waived.
- A local developer uses seeded admin credentials outside local/test: documentation must clearly state the prohibition and production bootstrap difference.
- GitHub Actions exists but does not include all required checks: the pipeline is considered incomplete and cannot be treated as the release authority.
- Containers build successfully but the worker or backing services are omitted from verification: runtime parity is incomplete.
- BDD files are added without lint/static-analysis coverage: BDD adoption is incomplete and non-compliant.
- User-visible failure messages expose provider, database, queue, or secret details: the implementation fails the sanitized-error requirement.
- Mermaid diagrams fall behind architecture changes: the overhaul documentation is incomplete.
- A feature passes functional tests but lacks first-payments evidence: it cannot be declared ready for live payment collection.

## Requirements

### Governance & Standards

- **FR-001**: The constitution MUST be amended to explicitly govern GitHub Actions CI/CD, full application containerisation, graceful failure handling, local startup documentation, Mermaid diagrams, release readiness checklists, and first-payments readiness.
- **FR-002**: The Definition of Ready MUST require CI gate design, container topology planning, graceful-failure UX planning, and the identification of required overhaul artifacts before implementation begins.
- **FR-003**: The Definition of Done MUST require GitHub Actions workflow delivery, containerised runtime verification, local startup documentation updates, Mermaid diagram updates, release checklist updates, and first-payments signoff where relevant.
- **FR-004**: The governance model MUST require durable best practices discovered during the overhaul process to be folded back into standards documents, templates, and checklists.

### Local Development Bootstrap

- **FR-005**: The project MUST provide a local development bootstrap document covering prerequisites, environment variables, local service startup, migrations, seeding, worker startup, validation steps, and troubleshooting.
- **FR-006**: The local bootstrap document MUST identify which secrets can use placeholders in local development and which values must be obtained from provider test environments.
- **FR-007**: The local bootstrap document MUST document a seeded local/test admin account and explicitly state that it is unavailable in production.
- **FR-008**: The local bootstrap process MUST describe how to validate that the app, worker, database, and Redis are functioning together after startup.

### CI/CD And Pipeline Quality Gates

- **FR-009**: The platform overhaul MUST define GitHub Actions as the mandatory CI/CD control plane for validation, build, security scanning, preview verification, and release gating.
- **FR-010**: The GitHub Actions design MUST include jobs for linting, type validation, unit tests, integration tests, BDD and smoke-test validation, contract checks, security checks, build validation, container build, container scanning, preview verification, and release promotion controls.
- **FR-011**: Required pipeline jobs and statuses MUST be defined before implementation begins and treated as the authoritative merge and release gate.
- **FR-012**: BDD scenarios, step definitions, fixtures, smoke-test helpers, and other support code MUST pass the same linting, static analysis, and pipeline validation as application code with no special exemptions.

### Containerisation

- **FR-013**: The platform overhaul MUST define a full containerised runtime topology for the web app, worker, and required backing services.
- **FR-014**: Containerisation requirements MUST support local development, CI validation, and preview or staging verification with practical parity to production.
- **FR-015**: Container verification MUST include healthchecks, startup expectations, and whole-system smoke validation rather than image build success alone.
- **FR-016**: Any runtime component that is not containerised MUST have an approved documented exception with rationale and operational trade-offs.

### UX, Accessibility, Responsiveness, And Failure Behavior

- **FR-017**: The overhaul MUST maintain WCAG 2.2 AA compliance as a non-negotiable requirement for customer and admin experiences.
- **FR-018**: Affected user journeys MUST define responsive behavior for mobile, tablet, and desktop layouts as well as keyboard-only and touch interactions.
- **FR-019**: Critical workflows MUST define graceful behavior for validation failures, service degradation, retries, timeouts, expired sessions, and partial failures.
- **FR-020**: User-facing error messages MUST be clear and actionable while remaining minimally informative and sanitized.
- **FR-021**: Sensitive implementation details such as secrets, provider internals, infrastructure topology, queue states, and operational diagnostics MUST NOT be exposed in user-visible failures.
- **FR-022**: Failure paths MUST preserve user progress where practical and provide explicit recovery guidance.
- **FR-023**: Accessibility requirements for failure states MUST include focus management, keyboard operation, screen-reader clarity, and readable inline messaging.

### Architecture And Diagram Documentation

- **FR-024**: The overhaul documentation MUST include a Mermaid system architecture diagram covering the web app, worker, backing services, providers, and delivery pipeline.
- **FR-025**: The overhaul documentation MUST include a Mermaid target data-model diagram showing the planned domain direction and major entities.
- **FR-026**: Diagram artifacts MUST be updated whenever material architecture or domain-model changes are introduced by later implementation work.

### Release Readiness And First Payments

- **FR-027**: The overhaul MUST provide a production-readiness checklist covering code quality, CI evidence, container verification, environment configuration, accessibility evidence, preview/staging signoff, and rollback readiness.
- **FR-028**: The overhaul MUST provide a first-payments readiness checklist covering test-mode validation, webhook verification, refund-path verification, admin observability, support readiness, and go-live approval.
- **FR-029**: Release decisions MUST require explicit evidence from the relevant readiness checklists and pipeline runs.
- **FR-030**: No feature or platform state may be declared ready for live payment collection unless the first-payments readiness gate has been completed and approved.

## Key Entities

- **Governance Artifact**: A standards or control document that governs planning, implementation, validation, or release activity. Examples include the constitution, Definition of Ready, Definition of Done, checklists, and release evidence templates.
- **Overhaul Artifact**: A platform-overhaul specific deliverable such as the local bootstrap guide, Mermaid diagrams, release checklists, or GitHub Actions workflow definition.
- **Quality Gate**: A required validation threshold that must pass before work can advance to the next delivery stage.
- **First-Payments Readiness Gate**: A specialized release gate for enabling live payment collection, requiring operational, technical, and support evidence beyond ordinary feature completion.

## Success Criteria

- **SC-001**: Governance source documents explicitly require GitHub Actions CI/CD, full application containerisation, graceful failure handling, local startup docs, Mermaid diagrams, and release readiness artifacts.
- **SC-002**: A dedicated platform-overhaul spec set exists with detailed functional requirements covering the highlighted platform concerns.
- **SC-003**: Local development bootstrap guidance exists and documents the local/test-only admin credential policy clearly.
- **SC-004**: Production-readiness and first-payments readiness checklist documents exist and are ready to be used as release evidence gates.
- **SC-005**: BDD acceptance testing is explicitly governed as subject to the same linting and pipeline quality standards as application code.

## Definition Of Done

- Governance amendments drafted in the governing source documents.
- Platform-overhaul spec artifacts created (`spec.md`, `plan.md`, `tasks.md`).
- Local development bootstrap documentation created.
- Production-readiness and first-payments readiness checklist documents created.
- Architecture and target data-model diagram deliverables explicitly defined for future implementation work.
