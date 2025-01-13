Steps to import/upgrade lamejs into Moodle:

1. Open your terminal.

2. Check the latest version of lamejs by running the command:

      npm view lamejs version

3. Note the output and compare it with the version in the lib/editor/tiny/plugins/recordrtc/thirdpartylibs.xml.
   If the version is newer, proceed to the next step. Otherwise, the upgrade is unnecessary.

4. Change the current working directory to your Moodle directory.

5. Install the package by running the command:

      npm install lamejs

6. Copy the content of `node_modules/lamejs/lame.all.js` and
   paste it into `lib/editor/tiny/plugins/recordrtc/amd/src/lame.all.js` after the line:

      ```
      eslint-disable
      ```

7. Add the following code to the bottom of the `lib/editor/tiny/plugins/recordrtc/amd/src/lame.all.js` file:

      ```
      export default lamejs;

      ```

8. Update the new version in the `lib/editor/tiny/plugins/recordrtc/thirdpartylibs.xml` file.

9. Clean up by removing the package:

      npm remove lamejs
