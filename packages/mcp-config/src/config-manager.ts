import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  Config,
  ConfigSchema,
  DEFAULT_CONFIG,
  CONFIG_DIR,
  CONFIG_FILE,
  Profile,
  ProfileInfo,
  Environment,
} from './types.js';

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const configDir = join(homedir(), CONFIG_DIR);
    this.configPath = join(configDir, CONFIG_FILE);

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    if (!existsSync(this.configPath)) {
      this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      return ConfigSchema.parse(parsed);
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  private saveConfig(config: Config): void {
    writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    this.config = config;
  }

  getConfigDir(): string {
    return join(homedir(), CONFIG_DIR);
  }

  listProfiles(): ProfileInfo[] {
    return Object.entries(this.config.profiles).map(([name, profile]) => ({
      name,
      environment: profile.environment,
      isActive: this.config.active_profile === name,
    }));
  }

  getActiveProfile(): { name: string; profile: Profile } | null {
    if (!this.config.active_profile) {
      return null;
    }

    const profile = this.config.profiles[this.config.active_profile];
    if (!profile) {
      return null;
    }

    return { name: this.config.active_profile, profile };
  }

  getProfile(name: string): Profile | null {
    return this.config.profiles[name] || null;
  }

  createProfile(
    name: string,
    apiKey: string,
    apiSecret: string,
    environment: Environment
  ): void {
    if (this.config.profiles[name]) {
      throw new Error(`Profile "${name}" already exists`);
    }

    const newConfig: Config = {
      ...this.config,
      profiles: {
        ...this.config.profiles,
        [name]: {
          api_key: apiKey,
          api_secret: apiSecret,
          environment,
        },
      },
    };

    // If this is the first profile, make it active
    if (!newConfig.active_profile) {
      newConfig.active_profile = name;
    }

    this.saveConfig(newConfig);
  }

  updateProfile(
    name: string,
    updates: Partial<Profile>
  ): void {
    const existing = this.config.profiles[name];
    if (!existing) {
      throw new Error(`Profile "${name}" does not exist`);
    }

    const newConfig: Config = {
      ...this.config,
      profiles: {
        ...this.config.profiles,
        [name]: {
          ...existing,
          ...updates,
        },
      },
    };

    this.saveConfig(newConfig);
  }

  deleteProfile(name: string): void {
    if (!this.config.profiles[name]) {
      throw new Error(`Profile "${name}" does not exist`);
    }

    const { [name]: _, ...remainingProfiles } = this.config.profiles;

    const newConfig: Config = {
      ...this.config,
      profiles: remainingProfiles,
      active_profile:
        this.config.active_profile === name
          ? Object.keys(remainingProfiles)[0] || null
          : this.config.active_profile,
    };

    this.saveConfig(newConfig);
  }

  switchProfile(name: string): void {
    if (!this.config.profiles[name]) {
      throw new Error(`Profile "${name}" does not exist`);
    }

    const newConfig: Config = {
      ...this.config,
      active_profile: name,
    };

    this.saveConfig(newConfig);
  }

  hasProfiles(): boolean {
    return Object.keys(this.config.profiles).length > 0;
  }
}
