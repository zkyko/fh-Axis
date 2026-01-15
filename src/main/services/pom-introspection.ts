import * as fs from 'fs';
import * as path from 'path';

type PomFileEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir';
};

/**
 * Lightweight POM (Page Object Model) folder introspection used by the POM Browser UI.
 * This intentionally avoids any Playwright-specific assumptions and just scans the filesystem.
 */
export class PomIntrospectionService {
  resolveDefaultPomRoot(repoRoot: string): string | null {
    try {
      if (!repoRoot) return null;
      const pages = path.join(repoRoot, 'pages');
      if (fs.existsSync(pages) && fs.statSync(pages).isDirectory()) return pages;
      return fs.existsSync(repoRoot) ? repoRoot : null;
    } catch {
      return null;
    }
  }

  listPomSubfolders(repoRoot: string): PomFileEntry[] {
    const root = this.resolveDefaultPomRoot(repoRoot);
    if (!root) return [];
    return this.listDirs(root);
  }

  listPomFiles(pomRoot: string): PomFileEntry[] {
    if (!pomRoot || !fs.existsSync(pomRoot)) return [];
    try {
      const entries = fs.readdirSync(pomRoot, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => ({
          name: e.name,
          path: path.join(pomRoot, e.name),
          type: 'file' as const,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  scanPomFolder(pomRoot: string): PomFileEntry[] {
    if (!pomRoot || !fs.existsSync(pomRoot)) return [];
    const out: PomFileEntry[] = [];
    const visit = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          out.push({ name: e.name, path: full, type: 'dir' });
          visit(full);
        } else if (e.isFile()) {
          out.push({ name: e.name, path: full, type: 'file' });
        }
      }
    };

    try {
      visit(pomRoot);
      return out;
    } catch {
      return [];
    }
  }

  private listDirs(dir: string): PomFileEntry[] {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => ({
          name: e.name,
          path: path.join(dir, e.name),
          type: 'dir' as const,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
}


