import React from "react";
import {Button} from "@moodlehq/design-system";
import {requireAmd} from '@moodle/lms/core/amd';

/**
 *
 * @param {string} key is a string key
 * @param {string} component is a component name
 * @param {Array} params is array of data
 * @returns {Promise}
 */
async function getString(key, component, params = {}) {
  const str = await requireAmd("core/str");
  return str.get_string(key, component, params);
}

/**
 * Loads a modal form.
 *
 * @param {object} props object properties sent from renderer
 * @param {Event} event
 */
const loadModalForm = async(props, event) => {
  event?.preventDefault();
  const ModalForm = await requireAmd("core_form/modalform");
  const modalHeader = await getString("modal_header", "local_reactdemo");
  const form = new ModalForm({
    formClass: "local_reactdemo\\simple2complex_form",
    args: {contextid: props.contextid},
    modalConfig: {title: modalHeader},
    returnFocus: event?.currentTarget ?? null,
  });
  form.show();
};

/**
 * Renders react components.
 * @param {object} props
 * @returns A JSX.Element representing the component UI
 */
function App(props) {
  const [tick, setTick] = React.useState(0);
  window.console.log(tick);
  React.useEffect(() => {
    setTimeout(() => setTick(t => t + 1), 500);
  }, []);

  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    async function load() {
      const text = await getString("text", "local_reactdemo");
      setLabel(text);
    }

    load().catch((error) =>
      window.console.error("Failed to load string", error)
    );
  }, []);

  return (
    <div>
      {label || "Hello from my new file"}
      <br />
      <Button label="Modal form?" onClick={() => loadModalForm(props)} />
    </div>
  );
}

/**
 * Export the App.
 * @param {object} props
 * @returns A JSX.Element representing the component UI
 */
export default function init(props = {}) {
  return <App {...props} />;
}
