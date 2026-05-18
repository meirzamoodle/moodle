@block @block_hello_world
Feature: The Hello World block displays a greeting on the dashboard
  In order to validate the block_hello_world plugin
  As an admin
  I can add the Hello World block to the dashboard and see the greeting

  Scenario: Admin adds the Hello World block to the dashboard and sees the greeting
    Given I log in as "admin"
    And I follow "Dashboard"
    And I turn editing mode on
    When I add the "Hello World" block
    Then I should see "Hello, World!" in the "Hello World" "block"

  Scenario: Admin can remove the Hello World block from the dashboard
    Given I log in as "admin"
    And I follow "Dashboard"
    And I turn editing mode on
    And I add the "Hello World" block
    When I delete the "Hello World" block
    Then I should not see "Hello, World!"
