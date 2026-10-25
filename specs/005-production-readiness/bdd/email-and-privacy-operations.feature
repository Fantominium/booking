Feature: Email delivery and customer privacy operations
  Queue and privacy jobs are idempotent, recoverable, and auditable without excess PII.

  @operator @email
  Scenario: Worker sends a queued transactional email
    Given a configured verified sender and a queued message
    When the email worker processes the job
    Then delivery status is observable and the customer receives the intended message

  @operator @email @retry
  Scenario: Worker restarts and retries bounded failures
    Given the worker or provider becomes unavailable during delivery
    When the worker restarts and applies its bounded retry policy
    Then duplicate delivery is prevented and exhausted failures are visible for recovery

  @operator @email
  Scenario: Queue outage can be recovered
    Given Redis or the email queue is unavailable
    When a booking notification cannot be queued or processed
    Then the booking state remains consistent and operators can recover delivery

  @customer @privacy
  Scenario: Confirm a deletion request once
    Given a valid unexpired deletion confirmation token
    When the customer confirms the request
    Then eligible customer data is deleted or anonymized transactionally
    And the token cannot be reused and the audit record minimizes personal data

  @customer @privacy
  Scenario Outline: Reject invalid deletion confirmations
    Given a deletion confirmation token that is <state>
    When the customer submits it
    Then deletion is not repeated and a safe error is returned

    Examples:
      | state   |
      | invalid |
      | expired |
      | replayed|

  @operator @privacy
  Scenario: Scheduled retention purge runs idempotently
    Given records have crossed the approved retention boundary
    When the scheduled purge runs more than once or encounters a recoverable failure
    Then eligible data is processed once and aggregate outcomes are observable without PII