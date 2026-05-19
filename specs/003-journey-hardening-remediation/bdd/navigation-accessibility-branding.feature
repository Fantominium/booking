Feature: Navigation accessibility and branding

  Scenario: Mobile guest opens the navigation dialog
    Given the viewport is mobile sized
    When the guest opens the menu trigger
    Then a modal navigation dialog is displayed
    And the close state is exposed with a standard close label

  Scenario: Header shows the TruFlow brand treatment
    Given the application header is visible
    Then the TruFlow logo is displayed to the left of the TruFlow title
