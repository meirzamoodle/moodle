@block @block_hello_world_blue
Feature: Add Hello World Blue block to dashboard
  In order to see the blue greeting
  As an admin
  I need to be able to add the Hello World Blue block to my dashboard

  Background:
    Given I log in as "admin"

  @javascript
  Scenario: Admin can add the Hello World Blue block to the dashboard
    Given I am on the "My home" page
    When I turn editing mode on
    And I add the "Hello World Blue" block
    Then I should see "Hello, World!" in the "Hello World Blue" "block"
