import React from "react";

/**
 * New type Props.
 */
type Props = {
    message: string;
};

/**
 * Render html elements.
 *
 * @param {Props} Props passed from template.
 * @returns A JSX.Element representing the component UI
 */
export default function Message({ message }: Props) {
    return (
        <div>
            <strong>Message</strong>
            <div>{message}</div>
        </div>
    );
}
