import { Profile, ProfileInfo, Environment } from './types.js';
export declare class ConfigManager {
    private configPath;
    private config;
    constructor();
    private loadConfig;
    private saveConfig;
    getConfigDir(): string;
    listProfiles(): ProfileInfo[];
    getActiveProfile(): {
        name: string;
        profile: Profile;
    } | null;
    getProfile(name: string): Profile | null;
    createProfile(name: string, apiKey: string, apiSecret: string, environment: Environment): void;
    updateProfile(name: string, updates: Partial<Profile>): void;
    deleteProfile(name: string): void;
    switchProfile(name: string): void;
    hasProfiles(): boolean;
}
//# sourceMappingURL=config-manager.d.ts.map