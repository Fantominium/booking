Feature: Production operations and controlled release
  Operators can detect, deploy, and recover the production system safely.

  @operator @health
  Scenario: Readiness reports required dependencies
    Given the web app, database, and Redis have known health states
    When an operator checks liveness and readiness
    Then liveness is separate from readiness and dependency failures are reported safely

  @operator @configuration
  Scenario: Production startup does not require Stripe secrets
    Given valid bank-transfer configuration and no Stripe variables
    When the production app builds and starts
    Then the app and health check remain usable

  @operator @worker @recovery
  Scenario: Worker and queue degradation is actionable
    Given the worker stops, queue age rises, or email delivery fails
    When monitoring evaluates the operational signals
    Then an actionable alert is emitted and worker recovery is documented

  @operator @bootstrap @security
  Scenario: Production seed refuses to mutate data
    Given a production-like database URL or environment
    When a destructive seed/bootstrap command is invoked
    Then it exits non-zero before the first write and provisions no default credentials

  @operator @backup @recovery
  Scenario: Restore a PostgreSQL backup
    Given an isolated staging target and a protected PostgreSQL backup
    When the documented restore drill is performed
    Then integrity, approved recovery objectives, access controls, and evidence are verified

  @operator @release @recovery
  Scenario: Deploy and recover a reviewed migration
    Given a reviewed migration and approved staging release
    When deployment succeeds or the migration fails
    Then the documented forward-fix or rollback path and smoke checks are demonstrated

  @operator @release
  Scenario: Promote only with complete release evidence
    Given the route matrix, automated checks, accessibility results, security scans, and drills
    When release promotion is requested
    Then any missing evidence or required signoff blocks promotion