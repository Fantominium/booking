Feature: Admin authorization

  Scenario: Guest user attempts to access the admin dashboard directly
    Given the user is not authenticated as an admin
    When the user navigates to /admin
    Then the user is redirected to the admin login page

  Scenario: Authenticated admin accesses secure admin tools
    Given the user is authenticated as an admin
    When the user opens the admin dashboard
    Then the user can reach services, bookings, and availability tools
