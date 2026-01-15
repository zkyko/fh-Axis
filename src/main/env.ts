import * as fs from 'fs';
import * as path from 'path';

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = contents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Support: export KEY=VALUE
    const withoutExport = line.startsWith('export ') ? line.slice('export '.length).trim() : line;

    const eqIdx = withoutExport.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = withoutExport.slice(0, eqIdx).trim();
    let value = withoutExport.slice(eqIdx + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Basic escape support
    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');

    if (key) out[key] = value;
  }

  return out;
}

/**
 * Loads env vars from `.env` in the current working directory (dev-friendly).
 *
 * - Does NOT overwrite already-set process.env vars.
 * - Safe to call multiple times.
 */
export function loadAxisEnv(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;

    const parsed = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof process.env[k] === 'undefined') {
        process.env[k] = v;
      }
    }
  } catch (e) {
    // Never crash the app for env loading issues.
    console.warn('[Axis] Failed to load .env:', e);
  }
}


