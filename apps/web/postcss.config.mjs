import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
/** @type {(id: string, base: string, options: unknown, atRule: import("postcss").AtRule) => Promise<string>} */
const defaultResolve = require('postcss-import/lib/resolve-id.js');

/**
 * postcss-import uses `resolve` (sync), which does not resolve `package.json#exports`.
 * Node's `import.meta.resolve` does — same as the app importing `@repo/ui/globals.css`.
 */
async function resolveStylesheet(id, base, options, atRule) {
  if (id.startsWith('@repo/')) {
    const parent = pathToFileURL(path.join(base, 'postcss-import.css')).href;
    return fileURLToPath(import.meta.resolve(id, parent));
  }
  return defaultResolve(id, base, options, atRule);
}

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    [
      'postcss-import',
      {
        filter: (id) => id.startsWith('@repo/'),
        resolve: resolveStylesheet,
      },
    ],
    ['@tailwindcss/postcss', {}],
  ],
};

export default config;
