Feature: Payment choice

  Scenario: Customer pays the deposit by card
    Given the customer has selected a valid service and time
    When the customer chooses the card payment option
    Then the customer sees the secure card payment form

  Scenario: Customer reserves with bank transfer
    Given the customer has selected a valid service and time
    When the customer chooses bank transfer
    Then the booking is reserved in a pending transfer state
    And the customer sees the bank transfer instructions and reference
