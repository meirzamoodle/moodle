The libraries were downloaded from:
react.js : https://esm.sh/stable/react@19.1.1/es2022/react.bundle.mjs
react-dom-client.js : https://esm.sh/stable/react-dom@19.1.1/es2022/client.bundle.mjs
jsx-runtime.js : https://esm.sh/stable/react@19.1.1/es2022/jsx-runtime.bundle.mjs
jsx-dev-runtime.js : https://esm.sh/stable/react@19.1.1/es2022/jsx-dev-runtime.bundle.mjs

Development/profiling artifacts (used when M.cfg.reactprofiling is enabled):
react.js : https://esm.sh/stable/react@19.1.1/es2022/react.development.mjs
react-dom-client.js : https://esm.sh/stable/react-dom@19.1.1/es2022/client.development.mjs
react-dom.js : https://esm.sh/v135/react-dom@19.1.1/es2022/react-dom.development.mjs
scheduler.js : https://esm.sh/v135/scheduler@0.26.0/es2022/scheduler.development.mjs
node_process.js : https://esm.sh/v135/node_process.js

Local patching (prod + dev):
- Replace esm.sh absolute imports ("/stable/...", "/v135/...") with bare specifiers so everything resolves via Moodle's import map.
