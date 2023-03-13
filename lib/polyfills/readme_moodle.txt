Polyfill.js file content is a combination of four packages.

The steps are essentially:

1.  Create a new folder "polyfill" in your home folder, e.g. ~/polyfill. You can use any name and any folder.

# mdn-polyfill
2.  Download the ZIP https://github.com/msn0/mdn-polyfills/tree/X.Y.Z, and extract it.
    Note: If the above URL is not working, please check in Releases/Tags/Branches.
3.  In the extracted folder, run "npm install && npm run prepare".
4.  In your terminal, run "cat CustomEvent.* Element.* Function.* HTMLCanvasElement.* MouseEvent.* Node.prototype.* NodeList.* > ~/polyfill/polyfill.js".

# url-polyfill
5.  Download the ZIP https://github.com/lifaon74/url-polyfill/tree/X.Y.Z, and extract it.
    Note: If the above URL is not working, please check in Releases/Tags/Branches.
6.  In your terminal, go to the extracted folder, run "cat url-polyfill.min.js >> ~/polyfill/polyfill.js".

# regenerator-runtime
7.  Download the ZIP file in https://github.com/facebook/regenerator/tree/X.Y.Z, and extract it.
    Note: If the above URL is not working, please check in Releases/Tags/Branches.
8. In your terminal, go to the extracted folder, run "cat packages/regenerator-runtime/runtime.js >> ~/polyfill/polyfill.js".

# core-js-bundle
9.  Download ZIP file in https://github.com/zloirock/core-js/tree/X.Y.Z, and extract it.
    Note: If the above URL is not working, please check in Releases/Tags/Branches.
10. In the extracted folder, run "npm install && npm run bundle-package".
11. In your terminal, run the below commands:
    - cat packages/core-js-bundle/minified.js >> ~/polyfill/polyfill.js
    - sed -i '/\/\/\# sourceMappingURL=minified.js.map/d' ~/polyfill/polyfill.js

# Final step
12. Copy ~/polyfill/polyfill.js into yourmoodle/lib/polyfills/polyfill.js