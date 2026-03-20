// eslint-disable-next-line no-new-func
const nativeImport = new Function('specifier', 'return import(specifier)');

/**
 * Import a native ESM module by bare specifier.
 *
 * @param {string} specifier The ESM bare specifier (e.g. '@moodle/lms/core/greeting').
 * @returns {Promise<object>} The module's exports.
 */
export const importEsm = (specifier) => nativeImport(specifier);
