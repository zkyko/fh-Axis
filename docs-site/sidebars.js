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
      label: 'Getting Started',
      items: [
        'getting-started/dev-setup',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/architecture',
        'architecture/ipc',
        'architecture/data-model',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/coding-standards',
        'development/testing',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/integrations',
        'integrations/jira',
      ],
    },
    {
      type: 'category',
      label: 'UI & Design',
      items: [
        'ui-design/ui-screens',
      ],
    },
    'security',
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
    'roadmap',
  ],
};

