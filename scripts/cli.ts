#!/usr/bin/env node
import { readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import prompts from 'prompts';

const scriptsDir = __dirname;

function discoverScripts(dir: string) {
  return readdirSync(dir)
    .filter(f => {
      const full = join(dir, f);
      return statSync(full).isFile() &&
        (extname(f) === '.ts' || extname(f) === '.js') &&
        !['cli.ts', 'cli.js'].includes(f);
    })
    .map(f => ({
      name: basename(f, extname(f)),
      file: join(dir, f)
    }));
}

async function main() {
  const scripts = discoverScripts(scriptsDir);
  if (scripts.length === 0) {
    console.log('No scripts found in this directory.');
    process.exit(1);
  }
  const response = await prompts({
    type: 'select',
    name: 'script',
    message: 'Select a script to run:',
    choices: scripts.map(s => ({ title: s.name, value: s.file }))
  });
  if (!response.script) process.exit(0);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(response.script);
}

main();
