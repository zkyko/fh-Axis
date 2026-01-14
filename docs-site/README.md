# Docusaurus Documentation Setup

This directory contains the public documentation for Axis.

## Setup Instructions

To set up the Docusaurus documentation site, run:

```bash
npx create-docusaurus@latest docs-site classic
cd docs-site
npm install
```

This will scaffold the Docusaurus site with the classic template.

## Adding Documentation

After scaffolding, add the documentation markdown files to the `docs/` directory. The documentation structure is:

- `docs/intro.md` - What Axis is
- `docs/architecture/overview.md` - Architecture overview
- `docs/architecture/ipc.md` - IPC contract documentation
- `docs/workflows/jira-bug-creation.md` - Jira workflow
- `docs/troubleshooting/common-errors.md` - Troubleshooting guide

## Running Locally

```bash
cd docs-site
npm run start
```

## Building for Production

```bash
cd docs-site
npm run build
```

## Important Notes

- **Docs are public, source is private.** Do not include secrets or sensitive information in documentation.
- The documentation will be hosted separately (e.g., GitHub Pages) from the source code repository.
- Keep documentation focused on architecture, workflows, and troubleshooting - not implementation details.

