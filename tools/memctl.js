#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMemoryCLI } from './lib/harness-cli.js';
export * from './lib/harness-memory.js';

const filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === filename) {
  try {
    const result = await runMemoryCLI(process.argv.slice(2), path.resolve(path.dirname(filename), '..'));
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    if (process.argv[2] === 'capacity' && !result.withinCapacity) process.exitCode = 1;
  } catch (error) { console.error(`memctl: ${error.message}`); process.exitCode = 1; }
}
