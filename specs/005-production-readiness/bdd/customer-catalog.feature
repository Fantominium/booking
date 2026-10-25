Feature: Customer catalog and service discovery
  Customers discover active bookable services without encountering dead ends.

  @customer @catalog @release-critical
  Scenario: Browse active services by offering type
    Given active services exist for sessions, events, and rentals
    When the customer opens the catalog and selects each offering filter
    Then only active services of the selected type are shown
    And the selected filter is preserved in the URL

  @customer @catalog
  Scenario: Inactive services are not publicly discoverable
    Given a service exists but is inactive
    When the customer requests the catalog or that service's detail route
    Then the inactive service is not exposed as bookable

  @customer @catalog
  Scenario: Empty catalog has a useful recovery state
    Given there are no active services
    When the customer opens the catalog
    Then an accessible empty state is shown
    And navigation back to the home route remains available

  @customer @catalog
  Scenario: Open a valid service detail
    Given an active service is listed
    When the customer selects that service
    Then its current description, duration choices, and price are shown
    And the customer can continue to availability

  @customer @catalog
  Scenario: Unknown service identifier recovers safely
    Given the requested service identifier does not exist
    When the customer opens its detail route
    Then a not-found outcome is shown without exposing internal errors
    And the customer can return to the catalog

  @customer @accessibility
  Scenario: Discover and navigate using keyboard and narrow viewport
    Given the customer uses only a keyboard at a viewport at least 320 pixels wide
    When they traverse catalog filters, service links, and the booking call to action
    Then every control has a visible focus indicator and usable accessible name
    And no content or control is clipped or overlapped