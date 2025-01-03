@gradeimport @gradeimport_xml @javascript @_file_upload
Feature: A teacher can import grades with a XML file or with an URL
  In order to import grades using a XML file
  As a teacher
  I need to be able to upload a local XML file or to give a remote file URL

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | Course 1 | C1        | topics |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | 1        | teacher1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | C1     | editingteacher |

  Scenario: The remote file URL field is disabled when the file picker is not empty
    Given I am on the "Course 1" "Course" page logged in as "teacher1"
    And I navigate to "XML file" import page in the course gradebook
    And I upload "lib/ddl/tests/fixtures/xmldb_table.xml" file to "File" filemanager
    Then the "disabled" attribute of "input#id_url" "css_element" should contain "true"

  Scenario: The file picker is disabled when the remote file URL field is not empty
    Given I am on the "Course 1" "Course" page logged in as "teacher1"
    And I navigate to "XML file" import page in the course gradebook
    And I set the following fields to these values:
      | Remote file URL | https://example.com/grades.xml |
    Then the "disabled" attribute of "input#id_userfile" "css_element" should contain "true"
