# Implementation Plan: Platform Overhaul Foundation

**Feature**: [002-platform-overhaul](spec.md)  
**Generated**: 2026-03-19  
**Status**: Ready for Governance And Planning Implementation

## Summary

This feature does not rebuild the full product. It establishes the standards, planning artifacts, release controls, and delivery expectations required before the wider platform overhaul proceeds.

The plan formalizes four outcomes:

1. Governance is amended so the overhaul is explicitly permitted and governed.
2. The future GitHub Actions pipeline and full application containerisation are defined as mandatory workstreams.
3. Supporting delivery artifacts exist for local startup, release readiness, and first live payments.
4. UX, accessibility, responsiveness, graceful failure handling, and BDD quality expectations are specified in advance rather than deferred.

## Technical Context

**Current Platform**: Next.js application with Prisma, PostgreSQL, Redis-backed worker process, Stripe integration, Storybook, Vitest, and Playwright  
**Delivery Constraint**: Existing governance was written primarily for the current service-booking implementation and needed expansion to support the broader platform-overhaul direction  
**Primary Control Plane Goal**: GitHub Actions becomes the authoritative CI/CD and release-gating system  
**Runtime Goal**: The application is validated as a full containerised topology rather than a partially packaged web app  
**Documentation Goal**: Local startup, release readiness, first-payments readiness, and architecture visibility are treated as delivery artifacts

## Constitution Check

- [x] Governance source documents updated to support the planned overhaul direction.
- [x] CI/CD and containerisation elevated from optional operational concerns to governed delivery requirements.
- [x] Accessibility, responsiveness, user friendliness, and graceful failure handling remain mandatory.
- [x] Documentation and release readiness elevated to first-class deliverables.

## Scope Of This Plan

### In Scope

- Drafting actual amendments to the constitution, Definition of Ready, and Definition of Done
- Creating a dedicated platform-overhaul spec set
- Creating local development bootstrap documentation
- Creating production-readiness and first-payments readiness checklists
- Defining the GitHub Actions and containerisation workstreams at the planning level
- Defining the BDD quality expectations at the planning and governance level

### Out Of Scope

- Implementing the GitHub Actions workflow files
- Implementing Dockerfiles, Compose files, or worker/container runtime code
- Rebuilding the booking domain model
- Drawing the final Mermaid diagrams themselves
- Refactoring application code to satisfy the future overhaul requirements

## Deliverables

### Governance Deliverables

- Updated constitution
- Updated Definition of Ready
- Updated Definition of Done

### Planning Deliverables

- Platform-overhaul specification
- Platform-overhaul plan
- Platform-overhaul tasks

### Supporting Documentation Deliverables

- Local development bootstrap guide
- Production-readiness checklist
- First-payments readiness checklist
- Governance amendment matrix
- Overhaul process guide

## Workstreams

### 1. Governance Alignment

Purpose:

- Ensure the overhaul is formally permitted and governed.

Key outputs:

- explicit GitHub Actions requirement
- explicit full-stack containerisation requirement
- explicit graceful failure and sanitized-error requirement
- explicit standards-feedback rule

### 2. GitHub Actions CI/CD Design

Purpose:

- Define the future CI/CD control plane before implementation begins.

Expected pipeline areas:

- lint and type checks
- unit/integration/BDD/smoke validation
- contract/security validation
- build validation
- container build and scan
- preview verification
- release promotion

### 3. Full App Containerisation

Purpose:

- Ensure runtime parity across local development, CI, preview/staging, and production decision-making.

Expected topology:

- web app
- worker
- PostgreSQL
- Redis
- optional supporting dev/test services as needed

### 4. UX, Accessibility, And Failure Behavior

Purpose:

- Ensure the overhaul retains user trust and avoids infrastructure-first thinking.

Key expectations:

- WCAG 2.2 AA
- mobile-first responsiveness
- keyboard and touch parity
- graceful validation, retry, timeout, and degraded states
- minimally informative user-visible failures

### 5. Developer Onboarding And Release Governance

Purpose:

- Turn setup and release quality into repeatable operational practice.

Key outputs:

- local bootstrap guide
- local/test seeded admin policy
- production readiness checklist
- first-payments readiness checklist

## Functional Requirement Clarifications

### GitHub Actions CI/CD

The highlighted requirement is not merely “have CI.” It means:

- the pipeline is designed before implementation
- it becomes the authoritative merge and release gate
- checks moved out of local pre-commit enforcement are still mandatory in CI
- BDD, smoke, and support code are not exempt from linting or static analysis

### Full Application Containerisation

The highlighted requirement is not just building one image. It means:

- the system is considered as a topology, not a single process
- worker and supporting services are part of validation
- runtime parity is a planning concern, not a post-build concern
- health and smoke verification matter as much as image build success

### Accessibility, Responsiveness, And User Friendliness

The highlighted requirement is not satisfied by a visual audit alone. It means:

- responsive behavior is defined for key breakpoints and interaction modes
- accessibility applies to both success and failure paths
- failure states must remain usable and understandable
- the overhaul cannot trade usability for infrastructure sophistication

### Graceful And Minimally Informative Failures

The highlighted requirement means:

- end users get clear next steps
- logs get the operational detail
- customer and admin UIs must not leak secrets or operational internals
- retries, degraded states, and partial outages are planned UX, not accidental behavior

### Local Development Startup And Seeded Admin Policy

The highlighted requirement means:

- a clean onboarding path exists for new developers
- environment creation is documented, not assumed
- local/test seeded credentials are explicit, safe, and forbidden in production
- startup verification covers the app and the worker, not just the web server

### Release Readiness And First Payments

The highlighted requirement means:

- feature completion is not sufficient for go-live
- release evidence must be documented
- live payment collection has a stronger approval threshold than normal deployment

## Dependencies

This planning feature depends on:

- the current governance sources being editable
- the existing docs/ and specs/ structure remaining the primary artifact locations
- the team accepting GitHub Actions and containerisation as core platform concerns

## Risks

- Governance language may still lag behind implementation if future specs are not updated consistently.
- The platform-overhaul scope may outgrow the current narrow domain assumptions without additional constitutional amendments.
- Teams may continue to treat local hooks as authoritative if the GitHub Actions migration is not made explicit in delivery practice.

## Exit Criteria

This planning feature is complete when:

- the source governance documents have been amended
- the platform-overhaul spec set exists
- the bootstrap and readiness checklist docs exist
- the highlighted functional requirements are documented with sufficient clarity to drive future implementation planning
