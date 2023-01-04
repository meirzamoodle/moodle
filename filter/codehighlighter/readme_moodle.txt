Description of Code Highlighter Filter in Moodle
====================================================

Code highlighter uses PrismJS.

* Download the latest release of PrismJS and the default themes from https://prismjs.com/.
* Select supported programming languages.

Supported programming languages:
* HTML/XML
* Javascript
* CSS
* PHP
* Ruby
* Python
* Java
* C
* C#
* C++

Changed:
* Wrap the PrismJS script with the below codes:
  define(() => { ... });
* Remove the below lines:
  * code[class*="language-"],
  * :not(pre) > code[class*="language-"],
  in the CSS theme (style.css) to avoid conflict with the native code tag style.