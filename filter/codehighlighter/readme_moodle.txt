Description of Code Highlighter Filter in Moodle
====================================================

Code highlighter uses PrismJS.

Why PrismJS?
---------------------------------------------------
One of the editors in Moodle is TinyMCE, and the Code Sample plugin makes use of PrismJS.
Hence, the code-highlighter filter likewise uses PrismJS to get the same behavior and look.

As a result, when we need to upgrade the PrismJS version in this filter,
We must take into account the PrismJS version that TinyMCE is currently using.

Upgrading steps:
---------------------------------------------------
Prerequisite: Make sure the grunt watcher is running during the below process:

1. Download PrismJS
   See the lib/editor/tiny/thirdpartylibs.xml to get the current TinyMCE version, for example: 6.3.2.
   Download the ZIP file at https://github.com/tinymce/tinymce/tree/6.3.2 and Extract the ZIP file.

2. In the extracted folder, run "yarn".

3. Copy the node_modules/prismjs/themes/prism.css to yourmoodle/filter/codehighlighter/styles.css

4. Edit the styles.css to make sure the identification is made using spaces, not tab, and remove trailing spaces.

5. To avoid conflict with the theme code tag style.
   Remove all the lines that contain 'code[class*="language-"]' text in the styles.css,
   and also remove the comma character after the text if necessary to make sure that the CSS structure is correct.
   Please see the examples below:
   * code[class*="language-"],
   * :not(pre) > code[class*="language-"],
   * code[class*="language-"]::-moz-selection,
   * code[class*="language-"] ::-moz-selection
   * code[class*="language-"]::selection,
   * code[class*="language-"] ::selection
   * code[class*="language-"]

6. In the extracted folder, run "./bin/build-prism.js"

7. Copy the node_modules/prismjs/prism.js to yourmoodle/filter/codehighlighter/amd/src/prism.js

8. Edit the prism.js to make sure the identification is made using spaces, not tab, and remove trailing spaces.

Note: As long as the grunt watcher says Done, then the upgrade process is complete.
