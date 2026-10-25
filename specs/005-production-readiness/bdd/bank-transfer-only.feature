Feature: Bank-transfer-only checkout
  Customer bookings remain pending until an authorized transfer reconciliation.

  @customer @payment @release-critical
  Scenario: Complete a booking using bank transfer
    Given a valid available service slot and configured transfer instructions
    When the customer submits contact details with bank transfer
    Then one pending booking is created with a safe unique reference
    And verified transfer instructions are returned
    And the response does not claim that payment is verified

  @customer @payment @security
  Scenario: Reject a card payment booking request
    Given a valid booking payload that requests card payment
    When the request reaches the booking API
    Then it is rejected before reservation or payment side effects

  @customer @payment @retry
  Scenario: Retry a transfer submission safely
    Given the original transfer booking has committed but its response was lost
    When the same idempotency key and payload are submitted again
    Then the original booking reference is returned without duplicate notification

  @customer @payment
  Scenario: Payment-intent creation is disabled
    Given the payment-intent API is called with a valid-shaped request
    When the request is handled in this release
    Then the API returns the documented unavailable response
    And no Stripe client or payment request is invoked

  @provider @payment @security
  Scenario: Stripe webhook is disabled
    Given a Stripe webhook request has any token, signature, or payload
    When the webhook route is called
    Then it returns the documented unavailable response
    And no booking or payment state is changed

  @customer @payment @recovery
  Scenario Outline: Resolve booking success route identifiers
    Given the success page receives a <identifier> booking identifier
    When the customer opens the success route
    Then the page shows a truthful pending-transfer state or a safe recovery outcome

    Examples:
      | identifier |
      | valid      |
      | missing    |
      | unknown    |

  @operator @payment
  Scenario: Start and build without Stripe configuration
    Given the required non-payment production configuration is present
    And Stripe variables are absent
    When the application builds, starts, and serves health checks
    Then those operations succeed without initializing Stripe