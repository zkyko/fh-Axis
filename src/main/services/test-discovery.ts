import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'fast-glob';

export interface TestFile {
  path: string;
  relativePath: string;
  name: string;
  size: number;
}

export interface TestFileTree {
  files: TestFile[];
  directories: string[];
}

const DEFAULT_PATTERNS = [
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/tests/**/*.ts',
  '**/test/**/*.ts',
  '**/*.spec.js',
  '**/*.test.js',
];

export class TestDiscoveryService {
  /**
   * Get default test file patterns
   */
  getDefaultPatterns(): string[] {
    return [...DEFAULT_PATTERNS];
  }

  /**
   * Get configured test file patterns from storage
   * Falls back to default patterns if not configured
   */
  async getPatterns(storage: any): Promise<string[]> {
    try {
      const patterns = await storage.getSetting('testDiscovery.patterns');
      if (patterns && Array.isArray(patterns) && patterns.length > 0) {
        return patterns;
      }
    } catch (e) {
      // Settings not available or not configured
    }
    return this.getDefaultPatterns();
  }

  /**
   * Discover test files in a repository
   * @param repoRoot Root directory of the repository
   * @param patterns Optional glob patterns (uses configured or default if not provided)
   */
  async discoverTestFiles(
    repoRoot: string,
    patterns?: string[],
    storage?: any
  ): Promise<TestFile[]> {
    if (!fs.existsSync(repoRoot)) {
      throw new Error(`Repository root does not exist: ${repoRoot}`);
    }

    // Get patterns
    let testPatterns: string[];
    if (patterns && patterns.length > 0) {
      testPatterns = patterns;
    } else if (storage) {
      testPatterns = await this.getPatterns(storage);
    } else {
      testPatterns = this.getDefaultPatterns();
    }

    // Build full paths for glob
    const globOptions = {
      cwd: repoRoot,
      absolute: false,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.d.ts',
      ],
    };

    const allFiles: TestFile[] = [];
    
    // Use glob to find matching files
    for (const pattern of testPatterns) {
      try {
        const matches = await glob(pattern, globOptions);
        for (const match of matches) {
          const fullPath = path.join(repoRoot, match);
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
              // Avoid duplicates
              if (!allFiles.find(f => f.relativePath === match)) {
                allFiles.push({
                  path: fullPath,
                  relativePath: match,
                  name: path.basename(match),
                  size: stats.size,
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to match pattern ${pattern}:`, error);
      }
    }

    // Sort by relative path
    allFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    return allFiles;
  }

  /**
   * Build a file tree structure from test files
   */
  buildFileTree(files: TestFile[]): TestFileTree {
    const directories = new Set<string>();
    
    files.forEach(file => {
      const dirParts = file.relativePath.split(path.sep);
      // Add all parent directories
      for (let i = 1; i < dirParts.length; i++) {
        directories.add(dirParts.slice(0, i).join(path.sep));
      }
    });

    return {
      files,
      directories: Array.from(directories).sort(),
    };
  }

  /**
   * Read file contents
   */
  async readFile(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * Check if a file is a test file based on patterns
   */
  async isTestFile(
    filePath: string,
    repoRoot: string,
    patterns?: string[],
    storage?: any
  ): Promise<boolean> {
    const relativePath = path.relative(repoRoot, filePath);
    if (relativePath.startsWith('..')) {
      return false; // File is outside repo root
    }

    let testPatterns: string[];
    if (patterns && patterns.length > 0) {
      testPatterns = patterns;
    } else if (storage) {
      testPatterns = await this.getPatterns(storage);
    } else {
      testPatterns = this.getDefaultPatterns();
    }

    // Check if file matches any pattern
    for (const pattern of testPatterns) {
      const normalizedPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      const regex = new RegExp(`^${normalizedPattern}$`);
      if (regex.test(relativePath)) {
        return true;
      }
    }

    return false;
  }
}

