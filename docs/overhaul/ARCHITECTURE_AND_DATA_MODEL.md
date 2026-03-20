# Architecture And Data Model

## Purpose

This page provides the markdown landing point for the platform-overhaul Mermaid diagrams so they are easy to review alongside the other overhaul documents.

## Diagram Sources

- [PLATFORM_ARCHITECTURE.mmd](PLATFORM_ARCHITECTURE.mmd)
- [TARGET_DATA_MODEL.mmd](TARGET_DATA_MODEL.mmd)

## What The Architecture Diagram Shows

The platform architecture diagram captures:

- customer and admin browser interactions
- GitHub Actions as the delivery control plane
- preview or staging verification path
- Next.js web app and background worker runtime
- PostgreSQL and Redis as required backing services
- external payment and email providers

## What The Target Data Model Diagram Shows

The target data model diagram captures the intended generalized direction for the platform, including:

- bookable items
- availability policy
- reservations
- payment attempts
- media assets
- audit events
- admin users

## Review Guidance

Use these diagrams together with:

- [OVERHAUL_PROCESS.md](OVERHAUL_PROCESS.md)
- [GITHUB_ACTIONS_PIPELINE_PLAN.md](GITHUB_ACTIONS_PIPELINE_PLAN.md)
- [CONTAINER_RUNTIME_TOPOLOGY_PLAN.md](CONTAINER_RUNTIME_TOPOLOGY_PLAN.md)
- [PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md)
- [FIRST_PAYMENTS_READINESS_CHECKLIST.md](FIRST_PAYMENTS_READINESS_CHECKLIST.md)

## Update Rule

If implementation changes the runtime topology or the target domain model materially, these Mermaid sources and this landing page must be updated as part of the same work.
