Feature: Customer journey completion

  Scenario: Customer starts a session booking from the homepage
    Given the customer is on the TruFlow homepage
    When the customer chooses the session quick path
    Then the customer reaches the session catalog
    And the customer can continue into a complete booking flow

  Scenario: Customer starts an event booking from the catalog
    Given the customer is on the booking catalog
    When the customer selects an event offering
    Then the customer can choose a date, time, and checkout details

  Scenario: Customer starts a rental booking from the mobile menu
    Given the customer opens the mobile navigation dialog
    When the customer selects the rentals link
    Then the customer reaches the rental catalog entries
