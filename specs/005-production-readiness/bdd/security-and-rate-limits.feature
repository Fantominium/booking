Feature: Public abuse controls and safe authorization boundaries
  Public abuse surfaces use distributed controls and do not trust caller-supplied identity.

  @security @auth
  Scenario: Login failures are throttled without account enumeration
    Given a client makes credential attempts against the configured limit
    When the limit is exceeded for an existing or unknown account
    Then responses do not reveal account existence and include safe retry information

  @security @auth
  Scenario: Password reset is private and rate limited
    Given an existing or unknown account and a reset request
    When reset is requested, confirmed, expired, or replayed
    Then public responses resist enumeration and tokens are single-use and bounded

  @security @rate-limit @concurrency
  Scenario: Limits are shared across application instances
    Given two independent app instances share the configured rate-limit store
    When the same client reaches the configured request limit across both instances
    Then the combined requests receive the configured 429 behavior and retry metadata

  @security @rate-limit
  Scenario: Spoofed forwarding headers cannot evade or poison limits
    Given an untrusted client supplies forged forwarding headers
    When a public endpoint derives the request identity
    Then only the configured trusted proxy chain determines the client address

  @security @privacy
  Scenario: Deletion endpoints resist abuse and token replay
    Given a customer requests deletion and receives a confirmation token
    When the customer retries, submits an invalid token, or replays a consumed token
    Then rate limits and one-time token semantics apply with sanitized responses

  @security @admin
  Scenario: Authorization is checked at each protected handler
    Given an actor lacks a valid admin role
    When a protected page or mutation API is called directly
    Then no protected data is read or mutation performed