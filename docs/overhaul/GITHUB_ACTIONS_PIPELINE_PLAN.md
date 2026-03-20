# GitHub Actions Pipeline Plan

## Purpose

This document translates the overhaul governance requirements into an implementation-focused GitHub Actions pipeline plan.

It does not yet create workflow files. It defines the target pipeline behavior and the checks that future implementation must codify.

## Pipeline Objectives

- make GitHub Actions the authoritative merge and release gate
- shift quality enforcement out of local pre-commit hooks and into reproducible CI checks
- ensure BDD, smoke tests, and support code are treated as first-class engineering artifacts
- verify the application as a full runtime topology rather than only as isolated source files

## Required Workflow Families

### 1. Validation Workflow

Purpose:
- fail quickly on source quality and configuration drift

Required checks:
- install dependencies
- lockfile integrity
- lint
- type validation
- formatting check if retained as a pipeline check
- Prisma validation and migration status check

### 2. Test Workflow

Purpose:
- validate functional correctness across multiple levels

Required checks:
- unit tests
- integration tests
- contract tests
- security-focused tests where applicable
- BDD support-code validation
- smoke-test code validation

### 3. End-To-End And Acceptance Workflow

Purpose:
- verify critical user journeys and cross-system behavior

Required checks:
- Playwright E2E tests
- BDD acceptance scenarios where adopted
- smoke suite against deployment-critical paths

### 4. Build Workflow

Purpose:
- verify production buildability and artifact generation

Required checks:
- application build
- Storybook build where retained as a required artifact

### 5. Container Workflow

Purpose:
- verify the platform as a containerised topology

Required checks:
- build web image
- build worker image
- verify container startup
- image vulnerability scan
- whole-system smoke validation in the container stack

### 6. Preview Or Staging Verification Workflow

Purpose:
- verify release candidates in a realistic deployed environment

Required checks:
- deploy preview or staging environment
- environment health validation
- smoke verification
- required release evidence collection

## Required Check Matrix

| Stage | Required Check | Why It Exists |
| --- | --- | --- |
| Validate | `lint` | Replaces local hook authority and enforces source quality centrally |
| Validate | `typecheck` | Prevents TypeScript drift and unsafe changes |
| Validate | `prisma-validate` | Detects schema/configuration issues before downstream jobs |
| Test | `unit` | Fast correctness validation for new logic |
| Test | `integration` | Validates service and DB interaction |
| Test | `contract` | Protects API assumptions |
| Test | `bdd-support-quality` | Ensures BDD code is linted and governed like application code |
| Acceptance | `e2e` | Verifies critical user journeys |
| Acceptance | `smoke` | Protects deployment-critical paths |
| Build | `build-app` | Confirms the app is shippable |
| Build | `build-storybook` | Preserves UI documentation artifact quality where required |
| Container | `build-images` | Verifies containerised delivery artifacts |
| Container | `scan-images` | Enforces container security hygiene |
| Container | `container-smoke` | Confirms topology-level operability |
| Release | `preview-verify` | Verifies pre-release deployment confidence |

## BDD And Smoke-Test Quality Rules

The pipeline must treat the following as first-class code:

- BDD feature support code
- step definitions
- test fixtures
- smoke-test helpers
- adapters that connect scenarios to the app or deployment environment

These artifacts must:

- pass linting
- pass static analysis where applicable
- follow the same code-quality expectations as application code
- avoid hidden bypasses or special exemptions

## Relationship To Lefthook

Current local hook behavior may remain for developer convenience, but the authoritative checks move to GitHub Actions.

That means:

- local hooks help catch issues earlier
- merge and release quality is decided by pipeline status
- BDD and smoke-test support code are not allowed to bypass the CI quality model even if local hooks are simplified later

## Release Gating Direction

The future release path should require these workflow stages to pass before promotion:

1. validate
2. test
3. acceptance
4. build
5. container verification
6. preview or staging verification
7. release approval

## Future Implementation Notes

When workflow files are created, they should minimize duplication by extracting shared setup steps while keeping job names stable enough to act as required branch checks.
