Feature: Authoritative availability and booking integrity
  The server is authoritative for every reservation and availability decision.

  @customer @booking @release-critical
  Scenario: Book an eligible active service using a listed duration
    Given the service is active and the selected duration and price are current
    And the requested start is in business hours and not blocked
    When the customer submits the booking
    Then the server creates one reservation using server-owned duration and price

  @customer @booking
  Scenario Outline: Reject ineligible or unavailable booking requests
    Given the booking has a <condition>
    When the customer submits the booking
    Then the server rejects it without creating a booking or email job

    Examples:
      | condition                 |
      | inactive service          |
      | unsupported duration      |
      | tampered price            |
      | malformed request         |
      | past start time           |
      | outside business hours    |
      | blackout date or range    |
      | daily capacity exceeded   |
      | stale or already used slot|

  @customer @booking @concurrency
  Scenario: Enforce full interval conflicts and the approved buffer
    Given an active reservation occupies a resource interval
    When a second request overlaps, shares its start or end, or leaves less than 60 minutes
    Then the second request is rejected at the transaction boundary
    And a legal half-open interval boundary does not count as interval overlap
    But the minimum 60-minute buffer still prevents adjacent reservations by default

  @customer @booking @concurrency
  Scenario: Only one conflicting concurrent reservation commits
    Given two customers request conflicting intervals for the same resource concurrently
    When both requests reach the database transaction
    Then at most one active reservation commits

  @customer @booking @retry
  Scenario: Repeating an identical request is idempotent
    Given a booking request has a valid idempotency key and has already committed
    When the customer retries the same key and payload after a timeout
    Then the original safe result is returned without another booking or email job

  @customer @booking @retry
  Scenario: Reusing a key with a different payload is rejected
    Given a booking request key has already been used with a different payload
    When the customer submits a changed request with that key
    Then the request is rejected without disclosing the original customer's data

  @customer @booking @recovery
  Scenario: Recover from stale availability without losing entered details
    Given the customer has completed contact details using previously available slots
    When another reservation makes the selected slot unavailable
    Then the server rejects the stale slot and gives an actionable recovery path
    And recoverable customer fields remain available for correction