import type {SwizzlePluginConfig} from '@moodle/lms/core/swizzle';

/**
 * Swizzle configuration for local_reactdemo.
 *
 * Lists every React component in this plugin that themes are permitted to
 * override, together with the supported actions and their safety levels.
 * Analogous to db/services.php (web services) or db/hooks.php (hooks).
 *
 * @module     local_reactdemo/swizzle.config
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
export const swizzleConfig = {
    local_reactdemo_button: {
        actions: {
            eject: 'safe',
            wrap: 'safe',
        },
        description: 'Demo action button that triggers a Moodle notification popup.',
    },
    local_reactdemo_counter: {
        actions: {
            eject: 'safe',
            wrap: 'safe',
        },
        description: 'Stateful click counter with increment button.',
    },
    local_reactdemo_greeting: {
        actions: {
            eject: 'unsafe',
            wrap: 'safe',
        },
        description: 'Fetches and displays a personalised greeting via the local_reactdemo_get_greeting web service.',
    },
    local_reactdemo_card: {
        actions: {
            eject: 'safe',
            wrap: 'safe',
        },
        description: 'Card component with title, body and optional footer. Directory-based: ejecting copies index.tsx and CardContent.tsx.',
    },
} satisfies SwizzlePluginConfig;
