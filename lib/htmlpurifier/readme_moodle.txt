Description of HTML Purifier library import into Moodle

* Make new (or delete contents of) /lib/htmlpurifier/
* Copy everything from /library/ folder to /lib/htmlpurifier/
* Copy CREDITS, LICENSE from root folder to /lib/htmlpurifier/
* Delete unused files:
    HTMLPurifier.auto.php
    HTMLPurifier.autoload.php
    HTMLPurifier.autoload-legacy.php
    HTMLPurifier.composer.php
    HTMLPurifier.func.php
    HTMLPurifier.includes.php
    HTMLPurifier.kses.php
    HTMLPurifier.path.php
* add locallib.php with Moodle specific extensions to /lib/htmlpurifier/
* add this readme_moodle.txt to /lib/htmlpurifier/

Local changes:
* MDL-77133 php 8.2 compliance. Added missing class properties that still need to be declared
  to avoid dynamic properties deprecated error warning.
  please apply the patch https://github.com/ezyang/htmlpurifier/pull/346