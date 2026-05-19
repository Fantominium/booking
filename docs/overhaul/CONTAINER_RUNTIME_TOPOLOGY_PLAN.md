# Container Runtime Topology Plan

## Purpose

This document defines the intended containerised runtime topology for the platform overhaul and the verification expectations for local development, CI, preview or staging, and production-oriented release decisions.

## Topology Goals

- validate the application as a system, not a single image
- provide practical parity across local development, CI, and preview or staging
- include the worker as a first-class runtime component
- make health and smoke verification part of runtime confidence

## Core Runtime Components

### Web App

Responsibilities:
- serve the customer and admin web experience
- host route handlers and server logic
- integrate with the database, Redis-backed workflows, and external providers

### Worker

Responsibilities:
- process queued background work
- support email or later asynchronous platform jobs
- surface runtime issues through logs and health signaling where applicable

### PostgreSQL

Responsibilities:
- persist domain state
- support migrations and seed flows

### Redis

Responsibilities:
- support queueing and related runtime coordination needs

## Environment Expectations

### Local Development

Minimum expectation:
- developers can run the web app, worker, PostgreSQL, and Redis together using a documented topology

Validation expectation:
- the local bootstrap flow proves that the app and worker can start successfully against the local services

### CI

Minimum expectation:
- GitHub Actions can run relevant tests and smoke checks against a containerised topology or an equivalent documented parity setup

Validation expectation:
- topology startup, health, and deployment-critical smoke checks are reproducible in CI

### Preview Or Staging

Minimum expectation:
- a realistic pre-release environment exists where the release candidate can be validated before promotion

Validation expectation:
- preview or staging verification includes health checks, smoke checks, and evidence collection for release approval

## Health And Verification Requirements

The containerised topology must support:

- startup validation
- service readiness validation
- topology-level smoke verification
- failure visibility through logs and clear operational signals

## Verification Questions The Topology Must Answer

- can the web app start successfully with the expected environment configuration?
- can the worker connect to its required services?
- can the app and worker operate together against PostgreSQL and Redis?
- can deployment-critical paths be checked quickly after startup?
- can the release process gather evidence from a realistic runtime, not just a source checkout?

## Exceptions Policy

If any runtime component is not containerised, the project must document:

- why the exception exists
- what operational trade-off it creates
- how parity is preserved in spite of the exception
- which owner approved the exception

## Future Implementation Direction

When implementation work begins, this plan should evolve to include:

- the actual container definitions
- healthcheck details
- local startup commands
- CI startup strategy
- preview or staging topology specifics
