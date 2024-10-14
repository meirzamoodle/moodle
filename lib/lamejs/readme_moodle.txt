# Lamejs

Fast mp3 encoder written in JavaScript. Lamejs is a rewrite of jump3r-code which is a rewrite of libmp3lame.
Repo: https://github.com/zhuker/lamejs

## Upgrade

1. Open your terminal.

2. Check the latest version of lamejs by running the command:

    npm view lamejs version

3. Note the output and compare it with the version in the lib/thirdpartylibs.xml. If the version is newer,
   proceed to the next step. Otherwise, the upgrade is unnecessary.

4. Change the current working directory to your Moodle directory.

5. Install the package by running the command:

    npm install lamejs

6. Copy the necessary files to the lib directory by running the command:

    cp node_modules/lamejs/{lame.min.js,LICENSE,README.md} lib/lamejs

7. Update the new version in the `lib/thirdpartylibs.xml` file.

8. Clean up by removing the package:

    rm remove lamejs
