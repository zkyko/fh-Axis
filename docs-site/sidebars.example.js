/**
 * Sidebars configuration for Docusaurus
 * 
 * After running `npx create-docusaurus@latest docs-site classic`,
 * copy this file to `sidebars.js` in the docs-site root directory.
 * 
 * This configures the navigation structure for the documentation.
 */

module.exports = {
  // Sidebar for the docs
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/ipc',
      ],
    },
    {
      type: 'category',
      label: 'Workflows',
      items: [
        'workflows/jira-bug-creation',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/common-errors',
      ],
    },
  ],
};

