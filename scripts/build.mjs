#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Dependencies that should NOT be bundled (must be installed at runtime)
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  // Node built-ins
  'node:*',
  'fs',
  'path',
  'os',
  'child_process',
  'crypto',
  'url',
  'http',
  'https',
  'stream',
  'util',
  'events',
  'readline',
];

const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external,
  sourcemap: true,
  // Resolve workspace packages by following their source
  packages: 'bundle',
};

async function build() {
  console.log('Building bundled distribution...\n');

  // Bundle CLI (main entry point)
  // Note: No shebang banner needed - cli.js wrapper provides it
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/cli.ts'],
    outfile: 'dist/cli.js',
  });
  console.log('  ✓ dist/cli.js');

  // Bundle server module
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/server.ts'],
    outfile: 'dist/server.js',
  });
  console.log('  ✓ dist/server.js');

  // Bundle index (re-exports)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
  });
  console.log('  ✓ dist/index.js');

  console.log('\nBuild complete!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
