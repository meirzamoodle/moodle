import {requireAmd} from '@moodle/lms/core/amd';

/**
 * New type Props.
 */
type Props = {
    label: string;
    message?: string;
};

/**
 * Loads a notification popup.
 *
 * @param {string} message is message to display.
 * @returns {void}
 */
async function showMoodlePopup(message: string) {
    const Notification = await requireAmd("core/notification");
    // Moodle notification popup.
    Notification.alert(message);
}

/**
 * Export the the component.
 *
 * @param {object} object of label and message
 * @returns A JSX.Element representing the component UI
 */
export default function Button({
    label,
    message = "Hello from local_reactdemo!",
}: Props) {
    const handleClick = () => {
        showMoodlePopup(message).catch((e) => {
            window.console.error("Failed to show Moodle popup", e);
            window.alert(message); // Fallback
        });
    };

    return (
        <button type="button" onClick={handleClick}>
            {label}
        </button>
    );
}
