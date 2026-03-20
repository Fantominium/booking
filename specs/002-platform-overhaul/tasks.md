# Tasks: Platform Overhaul Foundation

**Feature**: [002-platform-overhaul](spec.md)  
**Generated**: 2026-03-19  
**Status**: Ready for Execution

**Tests**: This feature is documentation and governance heavy. Where executable checks are not yet implemented, tasks must still define the future validation path and quality-gate expectations.

## Phase 1: Governance Amendments

- [x] T001 Amend the constitution in `.specify/memory/constitution.md` to govern GitHub Actions CI/CD, full-stack containerisation, graceful failure handling, local startup docs, Mermaid diagrams, and release readiness artifacts
- [x] T002 Amend `.specify/memory/technical-definition-of-ready.md` to require CI gate design, container topology planning, graceful-failure UX planning, BDD quality expectations, and required artifact identification before implementation starts
- [x] T003 Amend `.specify/memory/technical-definition-of-done.md` to require workflow delivery, container runtime verification, local startup docs, Mermaid diagram updates, release checklist updates, and first-payments signoff

## Phase 2: Overhaul Planning Artifacts

- [x] T004 Create `specs/002-platform-overhaul/spec.md` with detailed functional requirements for governance, CI/CD, containerisation, UX, accessibility, graceful failures, local bootstrap, and release gates
- [x] T005 Create `specs/002-platform-overhaul/plan.md` describing scope, workstreams, dependencies, and requirement clarifications
- [x] T006 Create `specs/002-platform-overhaul/tasks.md` to track the foundational overhaul planning work

## Phase 3: Supporting Documentation

- [x] T007 Create `docs/overhaul/GOVERNANCE_AMENDMENT_MATRIX.md`
- [x] T008 Create `docs/overhaul/OVERHAUL_PROCESS.md`
- [x] T009 Create `docs/overhaul/LOCAL_DEVELOPMENT_BOOTSTRAP.md`
- [x] T010 Create `docs/overhaul/PRODUCTION_READINESS_CHECKLIST.md`
- [x] T011 Create `docs/overhaul/FIRST_PAYMENTS_READINESS_CHECKLIST.md`
- [x] T011.5 Create `specs/002-platform-overhaul/checklists/requirements.md`

## Phase 4: Future Implementation Preparation

- [x] T012 Define the future GitHub Actions workflow breakdown in the overhaul implementation plan
- [x] T013 Define the future container topology and validation strategy in the overhaul implementation plan
- [x] T014 Define Mermaid system architecture and target data-model diagram deliverables
- [ ] T015 Define the future BDD acceptance-testing structure, linting rules, and smoke-test responsibilities in the overhaul implementation plan

## Phase 5: Detailed Planning Assets

- [x] T016 Create `docs/overhaul/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- [x] T017 Create `docs/overhaul/CONTAINER_RUNTIME_TOPOLOGY_PLAN.md`
- [x] T018 Create `docs/overhaul/PLATFORM_ARCHITECTURE.mmd`
- [x] T019 Create `docs/overhaul/TARGET_DATA_MODEL.mmd`
- [x] T020 Create `docs/overhaul/ARCHITECTURE_AND_DATA_MODEL.md`
- [x] T021 Implement GitHub Actions workflow updates in `.github/workflows/`
- [x] T022 Add container runtime scaffolding (`Dockerfile`, `Dockerfile.worker`, `docker-compose.yml`, `.dockerignore`)
- [x] T023 Add runtime health endpoint for smoke verification

## Completion Rule

This task set is complete when the platform-overhaul planning package is sufficient to guide future implementation without ambiguity on governance, delivery controls, or readiness expectations.
