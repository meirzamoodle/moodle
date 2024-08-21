# Version checks

Before proceeding with the upgrade, make sure there are new versions of the required packages using the following commands:

    npm view mdn-polyfills version
    npm view url-polyfill version
    npm view regenerator-runtime version
    npm view core-js-bundle version

Note each result and compare it to the version in lib/thirdpartylibs.xml

# The steps are essentially:

1) Install required packages

    npm install --no-save mdn-polyfills url-polyfill regenerator-runtime core-js-bundle

2) Join them all together:

    cd node_modules/mdn-polyfills
    cat CustomEvent.* Element.* Function.* HTMLCanvasElement.* MouseEvent.* Node.prototype.* NodeList.* > ../../lib/polyfills/polyfill.js

    cd ../url-polyfill/
    cat url-polyfill.min.js >> ../../lib/polyfills/polyfill.js

    cd ../regenerator-runtime
    cat runtime.js >> ../../lib/polyfills/polyfill.js

    cd ../core-js-bundle
    cat minified.js >> ../../lib/polyfills/polyfill.js
    sed -i '/\/\/\# sourceMappingURL=minified.js.map/d' ../../lib/polyfills/polyfill.js

3) Uninstall the packages again

    cd ../../
    npm uninstall --no-save mdn-polyfills url-polyfill regenerator-runtime core-js-bundle
