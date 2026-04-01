/**
 * New type Props.
 */
type Props = { who: string };

/**
 * Render html elements.
 *
 * @param {Props} Props passed from template.
 * @returns A JSX.Element representing the component UI
 */
export default function LocalreactdemoTest({who}: Props) {
    return (
        <div>
            <strong>Hello from local_reactdemo 👋</strong>
            <div>User: {who}</div>
        </div>
    );
}
