#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';

type PublishMode = 'always' | 'never' | 'onTag' | 'onTagOrDraft' | 'draft';

interface Options {
  ci: boolean;
  dryRun: boolean;
  skipBuild: boolean;
  publishMode?: PublishMode;
  verbose: boolean;
}

interface ParsedArgs {
  options: Options;
  passthrough: string[];
}

const WINDOWS = process.platform === 'win32';

function parseArgs(argv: string[]): ParsedArgs {
  const options: Options = {
    ci: false,
    dryRun: false,
    skipBuild: false,
    verbose: false,
  };

  const passthrough: string[] = [];
  const ownArgs: string[] = [];

  const separatorIndex = argv.indexOf('--');

  if (separatorIndex >= 0) {
    ownArgs.push(...argv.slice(0, separatorIndex));
    passthrough.push(...argv.slice(separatorIndex + 1));
  } else {
    ownArgs.push(...argv);
  }

  for (let i = 0; i < ownArgs.length; i += 1) {
    const arg = ownArgs[i];

    switch (arg) {
      case '--ci':
        options.ci = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--publish-mode': {
        const next = ownArgs[i + 1];
        if (!next) {
          throw new Error('--publish-mode requires a value');
        }
        if (!isPublishMode(next)) {
          throw new Error(`Unsupported publish mode "${next}"`);
        }
        options.publishMode = next;
        i += 1;
        break;
      }
      default:
        throw new Error(`Unknown flag "${arg}"`);
    }
  }

  return { options, passthrough };
}

function isPublishMode(value: string): value is PublishMode {
  return ['always', 'never', 'onTag', 'onTagOrDraft', 'draft'].includes(value);
}

async function runCommand(command: string, args: string[], verbose: boolean): Promise<void> {
  if (verbose) {
    console.log(`[publish] ${command} ${args.join(' ')}`);
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: WINDOWS,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 'null'}`));
    });
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(rawArgs);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
    return;
  }

  const { options, passthrough } = parsed;
  const env = process.env;

  const isCI = options.ci || env.CI === 'true';
  let publishMode: PublishMode | undefined = options.publishMode;

  if (options.dryRun) {
    publishMode = 'never';
  }

  if (!publishMode) {
    publishMode = isCI ? 'always' : 'never';
  }

  if (publishMode !== 'never' && !env.GH_TOKEN && !env.GITHUB_TOKEN) {
    console.error('GH_TOKEN (or GITHUB_TOKEN) is required when publish mode is not "never".');
    process.exit(1);
    return;
  }

  try {
    if (!options.skipBuild) {
      await runCommand('pnpm', ['build'], options.verbose);
    }

    const builderArgs = ['exec', 'electron-builder', '--config', 'electron-builder.config.js'];

    if (publishMode) {
      builderArgs.push('--publish', publishMode);
    }

    builderArgs.push(...passthrough);

    await runCommand('pnpm', builderArgs, options.verbose);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
