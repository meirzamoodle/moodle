Polyfill.js file content is a combination of four packages.

The steps are essentially:

1. Create new folder "polyfill" in your home folder e.g. ~/polyfill. You can use any name and any folder.

# mdn-polyfill
2. Download ZIP https://github.com/msn0/mdn-polyfills/tree/X.Y.Z
3. Extract the ZIP file
4. In the extracted folder, run "npm install && npm run prepare"
5. In your terminal, run "cat CustomEvent.* Element.* Function.* HTMLCanvasElement.* MouseEvent.* Node.prototype.* NodeList.* > ~/polyfill/polyfill.js"

# url-polyfill
6. Download ZIP https://github.com/lifaon74/url-polyfill/tree/X.Y.Z
7. Extract the ZIP file
8. In your terminal, run "cat url-polyfill.min.js >> ~/polyfill/polyfill.js"

# regenerator-runtime
9. Download ZIP file in https://github.com/facebook/regenerator/tree/X.Y.Z
10. Extract the ZIP file
11. In your terminal, run "cat packages/regenerator-runtime/runtime.js >> ~/polyfill/polyfill.js"

# core-js-bundle
12. Download ZIP file in https://github.com/zloirock/core-js/tree/X.Y.Z
13. Extract the ZIP file
14. In the extracted folder, run "npm install && npm run init && npm run bundle-package"
15. In your terminal, run below commands:
    - cat packages/core-js-bundle/minified.js >> ~/polyfill/polyfill.js
    - sed -i '/\/\/\# sourceMappingURL=minified.js.map/d' ~/polyfill/polyfill.js

# Final step
17. Copy ~/polyfill/polyfill.js into yourmoodle/lib/polyfills/polyfill.js