import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock homedir to use temp directory
const testDir = join(tmpdir(), `eduzz-mcp-test-${Date.now()}`);
const configDir = join(testDir, '.eduzz-mcp');

// We need to mock the module before importing
import { vi } from 'vitest';

vi.mock('node:os', async () => {
  const actual = await vi.importActual('node:os');
  return {
    ...actual,
    homedir: () => testDir,
  };
});

// Import after mocking
import { ConfigManager } from '../src/config-manager.js';

describe('ConfigManager', () => {
  beforeEach(() => {
    if (existsSync(configDir)) {
      rmSync(configDir, { recursive: true });
    }
    mkdirSync(configDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('should create config directory if not exists', () => {
    rmSync(configDir, { recursive: true });
    new ConfigManager();
    expect(existsSync(configDir)).toBe(true);
  });

  it('should create default config on first access', () => {
    const manager = new ConfigManager();
    const profiles = manager.listProfiles();
    expect(profiles).toEqual([]);
  });

  it('should create a profile', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'api-key', 'api-secret', 'sandbox');

    const profiles = manager.listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('test');
    expect(profiles[0].environment).toBe('sandbox');
    expect(profiles[0].isActive).toBe(true); // First profile becomes active
  });

  it('should not allow duplicate profile names', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'key', 'secret', 'sandbox');

    expect(() => {
      manager.createProfile('test', 'key2', 'secret2', 'production');
    }).toThrow('Profile "test" already exists');
  });

  it('should switch profiles', () => {
    const manager = new ConfigManager();
    manager.createProfile('sandbox', 'key1', 'secret1', 'sandbox');
    manager.createProfile('production', 'key2', 'secret2', 'production');

    manager.switchProfile('production');

    const active = manager.getActiveProfile();
    expect(active?.name).toBe('production');
    expect(active?.profile.environment).toBe('production');
  });

  it('should throw when switching to non-existent profile', () => {
    const manager = new ConfigManager();
    expect(() => {
      manager.switchProfile('nonexistent');
    }).toThrow('Profile "nonexistent" does not exist');
  });

  it('should delete a profile', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'key', 'secret', 'sandbox');
    manager.deleteProfile('test');

    const profiles = manager.listProfiles();
    expect(profiles).toHaveLength(0);
  });

  it('should update active profile when deleting active', () => {
    const manager = new ConfigManager();
    manager.createProfile('first', 'key1', 'secret1', 'sandbox');
    manager.createProfile('second', 'key2', 'secret2', 'production');

    // First is active
    manager.deleteProfile('first');

    const active = manager.getActiveProfile();
    expect(active?.name).toBe('second');
  });

  it('should update profile', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'old-key', 'old-secret', 'sandbox');

    manager.updateProfile('test', { api_key: 'new-key' });

    const profile = manager.getProfile('test');
    expect(profile?.api_key).toBe('new-key');
    expect(profile?.api_secret).toBe('old-secret'); // Unchanged
  });

  it('should persist config to file', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'key', 'secret', 'sandbox');

    const configPath = join(configDir, 'config.json');
    expect(existsSync(configPath)).toBe(true);

    const content = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(content.profiles.test).toBeDefined();
    expect(content.active_profile).toBe('test');
  });
});
