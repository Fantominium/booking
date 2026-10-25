Feature: Protected administrator operations
  Every admin page and API action denies access unless an authorized admin session is valid.

  @admin @authorization @release-critical
  Scenario Outline: Deny invalid administrator sessions
    Given the session is <session state>
    When the actor opens a protected admin page or calls its API
    Then the protected content and data are not returned
    And the actor receives an appropriate login or authorization recovery path

    Examples:
      | session state |
      | anonymous     |
      | wrong-role    |
      | expired       |
      | malformed     |

  @admin @authorization
  Scenario: Valid admin can operate the dashboard and bookings
    Given a valid admin session and bookings exist
    When the admin views dashboard, filters bookings, and opens a booking detail
    Then only authorized booking information is returned
    And empty, invalid-filter, and dependency-failure states are actionable

  @admin @services
  Scenario: Manage service configuration and media
    Given a valid admin session
    When the admin lists, creates, updates, or deletes services and uploads media
    Then valid changes are persisted and invalid, oversized, or conflicting changes are rejected

  @admin @availability
  Scenario: Manage hours, blocks, date overrides, and settings
    Given a valid admin session
    When the admin reads or changes availability policy
    Then valid changes are saved atomically and invalidate stale availability
    And malformed ranges or settings are rejected without partial writes

  @admin @payment @audit
  Scenario: Reconcile a pending bank transfer exactly once
    Given a pending bank-transfer booking and a valid admin session
    When the admin records a verified transfer
    Then the booking transition is audited and its confirmation side effects occur once
    And a repeated, cancelled, expired, or racing transition cannot succeed again

  @admin @booking
  Scenario: Cancel a booking and release capacity safely
    Given an active booking and a valid admin session
    When the admin cancels it
    Then capacity is released immediately and the cancellation is communicated once
    And repeated or racing state transitions have a deterministic outcome

  @admin @email
  Scenario: Recover a failed customer email
    Given an authorized admin and a failed or pending email delivery
    When the admin requests a resend
    Then the correct message is queued once or a sanitized actionable failure is returned

  @admin @accounts
  Scenario: Manage administrator accounts safely
    Given a valid admin session
    When the admin lists, creates, or deletes another administrator
    Then validation, duplicate, not-found, last-admin, and unauthorized outcomes are safe