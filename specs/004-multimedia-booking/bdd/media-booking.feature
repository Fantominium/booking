Feature: Multimedia booking media experience
  As a customer or admin
  I want service media to be configurable and rendered accessibly
  So that booking pages are engaging without harming usability or performance

  Background:
    Given multimedia planning decisions are approved for feature 004

  Scenario: Admin configures media through upload-only workflow
    Given I am an authenticated admin on the service configuration page
    When I upload valid hero and card media for a service and save
    Then the service is stored with media metadata
    And direct URL-only media input is not required in v1

  Scenario: Service-level hero media renders with required fade behavior
    Given a service has configured hero image media
    When a customer opens that service booking page
    Then hero media is displayed
    And hero text remains readable
    And the hero transitions into white background below hero text

  Scenario: Card banner media renders with fade below title
    Given a service has configured card banner media
    When a customer views the booking catalog
    Then the card banner is displayed
    And the banner fades into white below the service title
    And duration badges, pricing, and reserve actions remain available

  Scenario: Missing media falls back to neutral placeholder gradient
    Given a service has no configured media or media fails to load
    When a customer views booking surfaces
    Then a neutral placeholder gradient is rendered
    And booking interactions remain fully functional

  Scenario: Reduced-motion disables autoplay and animation
    Given a customer has prefers-reduced-motion enabled
    When multimedia booking surfaces are rendered
    Then autoplay and animation are disabled
    And static fallback media is shown instead

  Scenario: Alt text required unless media is decorative
    Given an admin is configuring media metadata
    When media is not marked decorative
    Then alt text is required
    And invalid submissions are rejected with field-level validation errors

  Scenario: Strict media limits are enforced
    Given an admin uploads media beyond permitted limits
    When validation runs
    Then save is blocked
    And validation errors identify size, resolution, or duration violations

  Scenario: Booking journey remains complete with media enabled
    Given media-enabled services exist in session, event, and rental categories
    When a customer completes the booking journey
    Then availability, checkout, and success behavior still complete without regressions

  Scenario: Performance guardrail is satisfied
    Given pre-feature Lighthouse baseline is recorded for booking routes
    When multimedia changes are evaluated
    Then Lighthouse performance score drop is no more than 2 points
