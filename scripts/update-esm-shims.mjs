// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Script to update the es-module-shims bundle.
 *
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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

  const filePath = path.join(esmshimsOutputDir, 'es-module-shims.js');

  console.log(chalk.green(`Downloading es-module-shims...`));
  await download(url, filePath);

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
