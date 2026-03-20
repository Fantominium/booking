# Platform Overhaul Process

## Purpose

This document accompanies the platform overhaul planning work. It defines how the overhaul should be specified, governed, documented, validated, and prepared for release.

It is intentionally process-focused rather than implementation-focused.

## Outcomes Required From The Overhaul

The platform overhaul must deliver:

- A governed implementation path aligned with the constitution and supporting standards
- A GitHub Actions-based CI/CD pipeline with explicit quality gates
- Full application containerisation for the web app, worker, and supporting services
- BDD acceptance scenarios and smoke-test support code that pass linting and pipeline validation without special exemptions
- Strong accessibility, responsiveness, and user-friendly UX behavior
- Graceful, minimally informative failure handling for customer and admin experiences
- Clear local development startup documentation
- Architecture and target data-model diagrams in Mermaid
- Production-readiness and first-payments readiness checklists
- A documented feedback loop that updates standards when best practices are discovered

## Core Workstreams

1. Governance Alignment
2. GitHub Actions CI/CD
3. Full App Containerisation
4. BDD Acceptance Testing And Smoke Validation
5. UX, Accessibility, and Responsive Quality
6. Secure Error Handling and Failure UX
7. Local Development Bootstrap
8. Architecture and Data Documentation
9. Release Governance
10. First-Payments Readiness

## Process Stages

### 1. Governance Preparation

Before implementation planning begins:

- review current constitution, Definition of Ready, and Definition of Done
- identify mismatches between current rules and planned platform direction
- document required amendments using the governance amendment matrix
- agree which amendments must be completed before implementation starts

### 2. Overhaul Specification

Create a dedicated platform overhaul spec set under `specs/` containing:

- `spec.md`
- `plan.md`
- `tasks.md`
- supporting checklists
- supporting research and data model artifacts as needed

The overhaul spec must include acceptance criteria for:

- pipeline quality gates
- containerised runtime topology
- BDD scenarios and smoke-test implementation quality
- accessibility and responsive behavior
- graceful failure handling
- documentation deliverables
- release and first-payments readiness

### 3. Local Development Documentation

A dedicated local bootstrap document must describe:

- prerequisites
- required environment variables
- local database and Redis startup
- worker startup
- migration and seed flow
- validation steps after startup
- troubleshooting guidance
- non-production test admin credentials and their usage policy

The seeded local admin user must be documented as local/test only and must never be treated as a production bootstrap mechanism.

### 4. Architecture Documentation

The overhaul must produce Mermaid diagrams for:

- system architecture
- runtime/container topology
- target data model

These diagrams must be updated when the platform architecture changes materially.

### 5. GitHub Actions CI/CD Design

Before implementation starts, define the required GitHub Actions jobs.

Minimum workflow areas:

- lint and type validation
- unit and integration tests
- BDD feature, step-definition, and smoke-test validation
- contract and security checks
- E2E and smoke tests
- build validation
- container build and scan
- preview/staging verification
- release promotion gates

CI must become the authoritative quality gate for the platform.

Any code written to support BDD, including step definitions, fixtures, adapters, and smoke-test helpers, must satisfy the same linting, static analysis, and pipeline requirements as application code. Moving checks from local pre-commit hooks into GitHub Actions does not create a lower standard for BDD artifacts.

### 6. Containerisation

The overhaul must define and validate a full runtime container topology covering:

- web app
- worker
- PostgreSQL
- Redis
- optional local-support services used for development or testing

Containerisation must support:

- local development
- CI validation
- preview or staging verification
- production deployment parity where practical

### 7. UX, Accessibility, and Failure Behavior

All critical flows must define:

- success states
- validation states
- timeout states
- degraded service states
- retry or recovery behavior
- safe, minimally informative user-facing error copy

Failures must be:

- graceful
- accessible
- clear about next steps
- not revealing of secrets or operational internals

### 8. Release Readiness Governance

The overhaul must create and maintain:

- production readiness checklist
- first-payments readiness checklist
- release evidence expectations
- named owners for each release gate

These checklists should be updated alongside the implementation.

## Mandatory Accompanying Artifacts

The overhaul process is incomplete without these documents:

- governance amendment matrix
- BDD and smoke-test quality rules in the implementation plan
- local development startup guide
- GitHub Actions pipeline implementation plan
- container runtime topology plan
- architecture and data-model markdown landing page
- Mermaid architecture diagram
- Mermaid data model diagram
- production readiness checklist
- first-payments readiness checklist
- release evidence pack template

## Evidence Expectations

Every major stage of the overhaul should leave behind evidence in documentation, tests, or pipeline configuration.

Evidence includes:

- approved specification artifacts
- updated governance documents
- container topology definitions
- CI workflow files and passing runs
- passing lint and pipeline evidence for BDD scenarios and support code
- accessibility and responsiveness validation
- smoke-test results
- release checklist completion

## Update Rule

If the overhaul discovers a repeatable best practice that should affect future work, the relevant standards documents must be updated.

At minimum, review for updates to:

- constitution
- Definition of Ready
- Definition of Done
- relevant templates
- release checklists

## Exit Criteria

The process is complete only when:

- governance updates are agreed and tracked
- overhaul specification artifacts exist
- supporting documentation artifacts exist
- required quality gates are defined
- containerised topology is defined
- release readiness artifacts are ready to govern implementation and go-live

## Relationship To Implementation

This process document does not replace the implementation plan.

It exists to ensure the future implementation plan is:

- governed
- testable
- releaseable
- auditable
- sustainable beyond a single delivery cycle
