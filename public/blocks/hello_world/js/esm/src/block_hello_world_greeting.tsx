/**
 * Hello World greeting React component.
 *
 * @module     block_hello_world/block_hello_world_greeting
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Component props.
 */
type Props = {
    greeting: string;
};

/**
 * Renders the Hello World greeting.
 *
 * @param {Props} props
 * @returns JSX element
 */
export default function BlockHelloWorldGreeting({greeting}: Props) {
    return (
        <div className="block-hello-world-greeting">
            <strong>{greeting}</strong>
        </div>
    );
}
