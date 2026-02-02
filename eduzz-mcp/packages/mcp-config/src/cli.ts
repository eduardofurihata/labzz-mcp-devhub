#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { ConfigManager } from './config-manager.js';
import { startServer } from './server.js';
import { Environment, EnvironmentSchema } from './types.js';

const args = process.argv.slice(2);
const command = args[0];

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function setup(): Promise<void> {
  console.log('\n=== Eduzz MCP Configuration Setup ===\n');

  const configManager = new ConfigManager();

  const name = await prompt('Profile name (e.g., sandbox, production): ');
  if (!name) {
    console.error('Profile name is required');
    process.exit(1);
  }

  const apiKey = await prompt('API Key: ');
  if (!apiKey) {
    console.error('API Key is required');
    process.exit(1);
  }

  const apiSecret = await prompt('API Secret: ');
  if (!apiSecret) {
    console.error('API Secret is required');
    process.exit(1);
  }

  let environment: Environment = 'sandbox';
  const envInput = await prompt('Environment (sandbox/production) [sandbox]: ');
  if (envInput) {
    const parsed = EnvironmentSchema.safeParse(envInput);
    if (parsed.success) {
      environment = parsed.data;
    } else {
      console.log('Invalid environment, using sandbox');
    }
  }

  try {
    configManager.createProfile(name, apiKey, apiSecret, environment);
    console.log(`\nProfile "${name}" created successfully!`);
    console.log(`Config stored at: ${configManager.getConfigDir()}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function list(): Promise<void> {
  const configManager = new ConfigManager();
  const profiles = configManager.listProfiles();

  if (profiles.length === 0) {
    console.log('No profiles configured. Run: eduzz-config setup');
    return;
  }

  console.log('\nConfigured profiles:');
  for (const profile of profiles) {
    const activeMarker = profile.isActive ? ' (active)' : '';
    console.log(`  - ${profile.name}${activeMarker}: ${profile.environment}`);
  }
  console.log();
}

async function switchProfile(name: string): Promise<void> {
  const configManager = new ConfigManager();

  try {
    configManager.switchProfile(name);
    console.log(`Switched to profile "${name}"`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function deleteProfile(name: string): Promise<void> {
  const configManager = new ConfigManager();

  try {
    configManager.deleteProfile(name);
    console.log(`Profile "${name}" deleted`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
Eduzz MCP Configuration CLI

Usage:
  eduzz-config <command> [options]

Commands:
  setup             Interactive setup wizard to create a new profile
  serve             Start the MCP server
  list              List all configured profiles
  switch <name>     Switch to a different profile
  delete <name>     Delete a profile
  help              Show this help message

Examples:
  eduzz-config setup
  eduzz-config list
  eduzz-config switch production
  eduzz-config serve
`);
}

async function main(): Promise<void> {
  switch (command) {
    case 'setup':
      await setup();
      break;
    case 'serve':
      await startServer();
      break;
    case 'list':
      await list();
      break;
    case 'switch':
      if (!args[1]) {
        console.error('Profile name required. Usage: eduzz-config switch <name>');
        process.exit(1);
      }
      await switchProfile(args[1]);
      break;
    case 'delete':
      if (!args[1]) {
        console.error('Profile name required. Usage: eduzz-config delete <name>');
        process.exit(1);
      }
      await deleteProfile(args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      if (command) {
        console.error(`Unknown command: ${command}`);
      }
      showHelp();
      break;
  }
}

main().catch(console.error);
