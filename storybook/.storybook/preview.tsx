import "./preview.css";

/** Global Storybook configuration shared by every story. */
const preview = {
    parameters: {
        layout: "fullscreen",
        controls: { expanded: true, sort: "requiredFirst" },
        options: {
            storySort: {
                order: [
                    "Getting Started",
                    "Customization",
                    ["Theming", "Layout", "Items", "Motion"],
                ],
            },
        },
    },
};

export default preview;
