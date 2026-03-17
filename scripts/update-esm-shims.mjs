import chalk from 'chalk';
import fs from "fs-extra";
import path from "path";
import {
    createPackageReadme,
    download,
    getPackageVersion,
    getRootDir,
    updateThirdPartyLibsXml,
} from './lib/util.mjs';

const rootDir = getRootDir();
const outputdir = path.resolve(rootDir, 'lib', 'js', 'bundles');
const esmshimsOutputDir = path.join(outputdir, 'esm-shims');
const ESM_SHIMS_VERSION = getPackageVersion('es-module-shims');

// File to download.
const url = `https://ga.jspm.io/npm:es-module-shims@${ESM_SHIMS_VERSION}/dist/es-module-shims.js`;


async function init() {
  console.log(chalk.blue.bold.underline('Updating es-module-shims bundles to version %s'), ESM_SHIMS_VERSION);

  fs.removeSync(esmshimsOutputDir);
  console.log(chalk.green('Removing old file ✓'));

  const fileDir = path.join(outputdir, 'esm-shims');
  const filePath = path.join(fileDir, 'es-module-shims.js');

  /**
   * @param {string} downloadedFilePath
   */
  const normalizeDownloadedFile = (downloadedFilePath) => {
    let content = fs.readFileSync(downloadedFilePath, 'utf-8');
    fs.writeFileSync(downloadedFilePath, content);
  };

  console.log(chalk.green(`Download ✓`));
  await download(url, filePath, normalizeDownloadedFile);


  // Create readme files in the package folders.
  console.log(chalk.green(`Creating readme_moodle.txt ✓`));
  createPackageReadme(esmshimsOutputDir, 'esm-shims');

  // Update the version in thirdpartylibs.xml.
  console.log(chalk.green(`Updating thirdpartylibs.xml ✓`));
  updateThirdPartyLibsXml(path.join(rootDir, 'lib'), 'js/bundles/esm-shims', 'esm-shims', ESM_SHIMS_VERSION);

  console.log("\nThe ESM module shims saved to " + esmshimsOutputDir.replace(rootDir, '[ROOT]') + chalk.green(" ✓"));
  console.log("Done!");
};

init().catch((err) => {
  console.error("Download failed:", err.message);
  process.exit(1);
});
