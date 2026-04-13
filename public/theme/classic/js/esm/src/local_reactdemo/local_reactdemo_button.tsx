// EJECT proof: Classic fully replaces the button — no import from Boost.
// Boost's ejected version (Bootstrap button + click counter) is never loaded.

export type Props = {
    label: string;
    message?: string;
};

/**
 * Classic theme EJECT of local_reactdemo_button.
 *
 * This is a full replacement — nothing from Boost or core is imported.
 * Proof: only this label appears; Boost's "boost theme" label is absent.
 *
 * @module     theme_classic/local_reactdemo/local_reactdemo_button
 */
export default function LocalReactdemoButton({label}: Props) {
    return (
        <button type="button">
            {label} — classic eject (Boost is NOT here)
        </button>
    );
}
