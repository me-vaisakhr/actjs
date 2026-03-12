import { parseArgs } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tsTemplate, jsTemplate } from './templates.js';

const VALID_TEMPLATES = ['typescript', 'javascript'] as const;
type Template = typeof VALID_TEMPLATES[number];

/** Resolve the actjs package root — two levels up from dist/create/index.js */
function resolveActjsRoot(): string {
  const distCreate = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(distCreate, '..', '..');
}

/**
 * Returns { binCmd, actjsDep } for the generated package.json.
 *
 * Local (inside actjs repo):
 *   binCmd  = "node <relative-path>/bin/actjs.js"  ← no npm install needed
 *   actjsDep = undefined                                ← no devDependencies
 *
 * Published (actjs on npm):
 *   binCmd  = "actjs"                              ← uses node_modules/.bin
 *   actjsDep = "latest"                                ← installs via npm install
 */
function resolveActjsBin(actjsRoot: string, target: string): { binCmd: string; actjsDep?: string } {
  const pkgPath = path.join(actjsRoot, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
    if (pkg.name === 'actjs') {
      const relBin = path.relative(target, path.join(actjsRoot, 'bin', 'actjs.js')).replace(/\\/g, '/');
      return { binCmd: `node ${relBin}` };
    }
  } catch { /* fall through */ }
  return { binCmd: 'actjs', actjsDep: 'latest' };
}

/**
 * Copy all .d.ts files from actjs dist/ into <target>/vendor/actjs/.
 * These provide IDE/TypeScript type support right away, before npm install.
 */
function copyActjsTypes(actjsRoot: string, target: string): void {
  const distDir   = path.join(actjsRoot, 'dist');
  const vendorDir = path.join(target, 'vendor', 'actjs');
  fs.mkdirSync(vendorDir, { recursive: true });

  for (const entry of fs.readdirSync(distDir)) {
    if (entry.endsWith('.d.ts')) {
      fs.copyFileSync(path.join(distDir, entry), path.join(vendorDir, entry));
    }
  }
}

export function runCreate(argv: string[]): void {
  const { positionals, values } = parseArgs({
    args: argv,
    options: {
      template: { type: 'string', default: 'typescript' },
    },
    allowPositionals: true,
    strict: false,
  });

  const name = positionals[0];
  if (!name) {
    console.error('Usage: create-actjs-app <project-name> [--template typescript|javascript]');
    process.exit(1);
  }

  // Validate project name (no path separators or special chars)
  if (!/^[a-z0-9@._/-]+$/i.test(name)) {
    console.error(`[create-actjs-app] Invalid project name: "${name}"`);
    process.exit(1);
  }

  const template = (values['template'] as string).toLowerCase() as Template;
  if (!VALID_TEMPLATES.includes(template)) {
    console.error(`[create-actjs-app] Unknown template "${template}". Available: ${VALID_TEMPLATES.join(', ')}`);
    process.exit(1);
  }

  const target    = path.resolve(name);
  const actjsRoot = resolveActjsRoot();

  if (fs.existsSync(target)) {
    console.error(`[create-actjs-app] Directory "${name}" already exists.`);
    process.exit(1);
  }

  const { binCmd, actjsDep } = resolveActjsBin(actjsRoot, target);
  const files = template === 'javascript'
    ? jsTemplate(name, binCmd, actjsDep)
    : tsTemplate(name, binCmd, actjsDep);

  for (const [filePath, content] of Object.entries(files)) {
    const abs = path.join(target, filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf-8');
  }

  // Pre-copy actjs type declarations so TypeScript/IDE works before npm install
  if (template === 'typescript') {
    copyActjsTypes(actjsRoot, target);
  }

  console.log(`\n  Created ${name} (${template})\n`);
  console.log(`  cd ${name}`);
  if (actjsDep) console.log(`  npm install`);
  console.log(`  npm run dev\n`);
}
