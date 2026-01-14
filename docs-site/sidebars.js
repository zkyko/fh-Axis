/**
 * Sidebars configuration for Docusaurus
 * 
 * This configures the navigation structure for the documentation.
 */

module.exports = {
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

