import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ConfigSchema, DEFAULT_CONFIG, CONFIG_DIR, CONFIG_FILE, } from './types.js';
export class ConfigManager {
    configPath;
    config;
    constructor() {
        const configDir = join(homedir(), CONFIG_DIR);
        this.configPath = join(configDir, CONFIG_FILE);
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        this.config = this.loadConfig();
    }
    loadConfig() {
        if (!existsSync(this.configPath)) {
            this.saveConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        try {
            const content = readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(content);
            return ConfigSchema.parse(parsed);
        }
        catch {
            return DEFAULT_CONFIG;
        }
    }
    saveConfig(config) {
        writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
        this.config = config;
    }
    getConfigDir() {
        return join(homedir(), CONFIG_DIR);
    }
    listProfiles() {
        return Object.entries(this.config.profiles).map(([name, profile]) => ({
            name,
            environment: profile.environment,
            isActive: this.config.active_profile === name,
        }));
    }
    getActiveProfile() {
        if (!this.config.active_profile) {
            return null;
        }
        const profile = this.config.profiles[this.config.active_profile];
        if (!profile) {
            return null;
        }
        return { name: this.config.active_profile, profile };
    }
    getProfile(name) {
        return this.config.profiles[name] || null;
    }
    createProfile(name, apiKey, apiSecret, environment) {
        if (this.config.profiles[name]) {
            throw new Error(`Profile "${name}" already exists`);
        }
        const newConfig = {
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
    updateProfile(name, updates) {
        const existing = this.config.profiles[name];
        if (!existing) {
            throw new Error(`Profile "${name}" does not exist`);
        }
        const newConfig = {
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
    deleteProfile(name) {
        if (!this.config.profiles[name]) {
            throw new Error(`Profile "${name}" does not exist`);
        }
        const { [name]: _, ...remainingProfiles } = this.config.profiles;
        const newConfig = {
            ...this.config,
            profiles: remainingProfiles,
            active_profile: this.config.active_profile === name
                ? Object.keys(remainingProfiles)[0] || null
                : this.config.active_profile,
        };
        this.saveConfig(newConfig);
    }
    switchProfile(name) {
        if (!this.config.profiles[name]) {
            throw new Error(`Profile "${name}" does not exist`);
        }
        const newConfig = {
            ...this.config,
            active_profile: name,
        };
        this.saveConfig(newConfig);
    }
    hasProfiles() {
        return Object.keys(this.config.profiles).length > 0;
    }
}
//# sourceMappingURL=config-manager.js.map