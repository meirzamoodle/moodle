export const init = (selector, name = 'World!') => {
    const target = document.querySelector(selector);
    if (!target) {
        return;
    }

    // React_autoinit's MutationObserver detects the new element and mounts the component.
    const container = document.createElement('div');
    container.dataset.reactComponent = '@moodle/lms/mod_book/greeter_component';
    container.dataset.reactProps = JSON.stringify({name});
    target.prepend(container);
};
