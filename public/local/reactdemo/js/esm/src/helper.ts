/**
 * Loads a requested module.
 *
 * @param {string} mod is module name.
 * @returns {Promise}
 */
export default function requireAmd(mod: string) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return new Promise<any>((resolve, reject) => {
        // Use any to avoid TypeScript errors with require.
        (require as any)([mod], resolve, reject);
    });
}