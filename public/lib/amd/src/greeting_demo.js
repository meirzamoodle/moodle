import {importEsm} from 'core/esm';

/**
 * Demonstrate calling an ESM utility from an AMD module.
 *
 * Call from PHP: $PAGE->requires->js_call_amd('core/greeting_demo', 'init', ['World']);
 *
 * @param {string} name The name to greet.
 */
export const init = async(name = 'World') => {
    const {greet} = await importEsm('@moodle/lms/core/greeting_string');
    // eslint-disable-next-line no-console
    console.log(greet(name));
};
