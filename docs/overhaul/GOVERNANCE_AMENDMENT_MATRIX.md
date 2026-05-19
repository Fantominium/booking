# Platform Overhaul Governance Amendment Matrix

## Purpose

This document translates the current governance gaps into concrete amendment targets for the project constitution, Definition of Ready, Definition of Done, and the future platform overhaul specification.

It is intended to be used before implementation planning begins for the platform overhaul.

## Scope

This matrix covers amendments needed to support:

- GitHub Actions as the required CI/CD control plane
- Full application containerisation across local, preview, staging, and production flows
- Graceful, minimally informative failure handling
- Stronger accessibility, responsiveness, and user-friendly UX governance
- Architecture and data diagrams maintained as part of delivery
- Local development bootstrap and non-production admin credential documentation
- Production-readiness and first-payments readiness quality gates
- A feedback loop that folds durable best practices back into standards documents

## Constitution Amendments

| Current Clause | Missing Requirement | Proposed Amendment | Reason | Governs Workstream |
| --- | --- | --- | --- | --- |
| Core Principles I and XI | No rule requires durable best practices discovered during major platform work to update standards docs | Add a Governance Feedback principle requiring standards, templates, and checklists to be updated when repeatable best practice is discovered | Prevents process drift and keeps standards current | Standards evolution |
| Technology Standards | GitHub Actions is not explicitly required as the CI/CD implementation target | Add a CI/CD Governance clause making GitHub Actions the mandatory source of truth for required checks, build validation, and release promotion gates | Makes pipeline delivery a governed artifact | GitHub Actions CI/CD |
| Deployment & Hosting | Full runtime containerisation is not explicitly required | Add a Containerisation clause requiring all production runtime components and local/preview topology to be containerised unless an approved exception exists | Establishes consistent environment parity | Full app containerisation |
| Simple UX / Responsive Design | No explicit rule for graceful degradation and recovery behavior | Add a UX Resilience clause requiring graceful degradation, preservation of user progress where possible, and clear recovery paths | Makes failure handling part of UX quality | UX resilience |
| Async & Error Handling / API Design Principles | No explicit rule that user-visible errors must be minimally informative and sanitized | Add a Failure Disclosure clause requiring sanitized customer/admin errors and forbidding operational detail leakage | Aligns security and UX behavior | Secure error handling |
| Documentation | No requirement for local startup docs, Mermaid diagrams, and release checklists on major platform work | Add a Platform Documentation clause requiring local bootstrap docs, architecture/data diagrams, and readiness checklists for major changes | Makes critical documentation part of delivery | Documentation and release governance |
| Project Vision / Data Model / Payments | Current constitution remains narrowly centered on single-service booking and Stripe-first assumptions | Amend domain and payment standards to distinguish current platform constraints from target extensibility rules | Avoids future overhaul work being constitutionally blocked by the current narrow domain | Domain redesign and payment architecture |

## Definition Of Ready Amendments

| Current Clause | Missing Requirement | Proposed Amendment | Reason | Governs Workstream |
| --- | --- | --- | --- | --- |
| Architecture & Interfaces | No readiness gate for the required GitHub Actions checks | Add a CI Gate Design item requiring jobs, required statuses, and thresholds to be defined before implementation starts | Forces quality gate design up front | GitHub Actions CI/CD |
| Test-First Plan | No explicit smoke-test planning requirement | Add a smoke-test planning item requiring deployment-critical paths to be identified during refinement | Separates release confidence from the full regression pack | Smoke tests |
| Test-First Plan | No explicit requirement that BDD scenarios and their supporting step-definition code conform to the same static analysis and pipeline quality standards as application code | Add a BDD quality item requiring BDD scenarios, support code, and test utilities to be lintable, type-safe where applicable, and compatible with the GitHub Actions checks that replace local pre-commit enforcement | Prevents BDD coverage from becoming an exception path that bypasses quality gates | BDD acceptance testing |
| Accessibility & UX Readiness | No explicit graceful-failure UX planning requirement | Add a graceful-failure item requiring retry, timeout, offline/degraded, and recovery states to be specified | Prevents late-stage failure-path design | UX resilience |
| Observability, Errors & Security | No readiness gate for user-visible disclosure policy | Add an error disclosure item covering safe user copy, logging detail, and operator-only diagnostics | Keeps safe error behavior intentional | Secure error handling |
| Dependencies & Technical Constraints | No readiness gate for container topology | Add a container topology item for web, worker, backing services, healthchecks, and parity strategy | Makes containerisation a design input | Full app containerisation |
| Delivery Artifacts & Ownership | No explicit requirement to plan local startup docs, Mermaid diagrams, and readiness checklists | Add a platform artifact item requiring those deliverables to be identified before work is accepted as Ready | Prevents documentation scope from being deferred | Documentation and release governance |
| Core Agile Foundation | No governance-impact assessment | Add an item requiring target governance docs to be identified if work will likely establish new standards | Closes the policy feedback loop | Standards evolution |

## Definition Of Done Amendments

| Current Clause | Missing Requirement | Proposed Amendment | Reason | Governs Workstream |
| --- | --- | --- | --- | --- |
| Test Quality & CI Gates | CI must pass, but the workflow itself is not a required deliverable | Add a workflow-delivery gate requiring GitHub Actions workflows to be implemented, green, and wired into required branch checks | Makes the pipeline part of completion | GitHub Actions CI/CD |
| Test Quality & CI Gates | No explicit completion gate that BDD feature files, step definitions, smoke tests, and their support code pass linting and the same pipeline checks as the rest of the codebase | Add a BDD compliance gate requiring all BDD artifacts and support code to pass linting, static analysis, and pipeline validation with no special exemptions | Ensures BDD remains a first-class quality practice rather than a bypass around engineering standards | BDD acceptance testing |
| Observability, Reliability & Security | Container hygiene is covered, but runtime interoperability is not | Add a runtime-parity gate requiring web, worker, and dependencies to be verified together in the container stack | Validates whole-system operability | Full app containerisation |
| Documentation & Release Readiness | No requirement for local bootstrap docs, admin seed policy, Mermaid diagrams, or readiness checklists | Add gates for local startup docs, non-production seed policy, architecture/data diagrams, production readiness checklist, and first-payments checklist | Captures all critical supporting artifacts | Documentation and release governance |
| Functional Completion | No explicit resilience and disclosure completion gate | Add a resilience-and-disclosure gate requiring graceful, accessible, minimally informative failure handling | Formalizes safe failure UX | UX resilience and secure error handling |
| UI, Accessibility & Performance | No explicit responsive verification gate across primary interaction modes | Add a responsive-verification gate for mobile, tablet, desktop, keyboard-only, and touch interaction | Turns mobile-first guidance into evidence-based completion | Accessibility and responsiveness |
| Documentation & Release Readiness | No first-payments signoff requirement | Add a first-payments gate covering sandbox signoff, webhook verification, refund paths, operator readiness, and rollback readiness | Distinguishes feature-complete from revenue-ready | First-payments readiness |
| Code Quality & Maintainability | Local hooks are still implicitly treated as authoritative in places | Reword local hook expectations so CI is authoritative for merge and release gating | Aligns governance with the future pipeline model | GitHub Actions CI/CD |

## Planned Overhaul Spec Amendments

The future platform overhaul specification should include explicit workstreams and acceptance criteria for:

- GitHub Actions pipeline design and implementation
- Full application containerisation
- BDD acceptance scenarios and smoke-test code that pass linting, static analysis, and pipeline gates
- Local development bootstrap documentation
- Non-production seeded admin credential policy
- Mermaid system architecture diagram
- Mermaid target data model diagram
- Graceful-failure UX for critical customer and admin flows
- Production readiness checklist
- First-payments readiness checklist
- Governance update tasks for constitution, DoR, and DoD

## Release Process Amendments

The future release process should define these named stages:

1. Validate
2. Test
3. Build
4. Image Scan
5. Preview Deploy
6. Smoke Verification
7. Staging Signoff
8. Production Promotion
9. First-Payments Go-Live Approval

Each stage should have explicit evidence requirements and named owners.

## Priority Order

Recommended amendment order:

1. Constitution
2. Definition of Ready
3. Definition of Done
4. Overhaul spec and release process

## Use During Planning

Use this matrix as input when drafting the future overhaul specification, planning tasks, and release governance documentation.
