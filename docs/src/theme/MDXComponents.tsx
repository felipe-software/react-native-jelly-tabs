import MDXComponents from "@theme-original/MDXComponents";
import StorybookPreview from "@site/src/components/StorybookPreview";

// Make <StorybookPreview /> available in every .mdx file without an import.
export default {
    ...MDXComponents,
    StorybookPreview,
};
