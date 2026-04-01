import React from "react";

/**
 * New type Props.
 */
type Props = {
    initial: number;
};

/**
 * Render html elements.
 *
 * @param {Props} Props passed from template.
 * @returns A JSX.Element representing the component UI
 */
export default function Counter({ initial }: Props) {
    const [count, setCount] = React.useState(initial);

    return (
        <div>
            <strong>Counter</strong>
            <div>Count: {count}</div>
            <button type="button" onClick={() => setCount((c) => c + 1)}>
                +
            </button>
        </div>
    );
}
