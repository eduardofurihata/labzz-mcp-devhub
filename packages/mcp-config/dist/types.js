import { z } from 'zod';
export const EnvironmentSchema = z.enum(['sandbox', 'production']);
export const ProfileSchema = z.object({
    api_key: z.string().min(1),
    api_secret: z.string().min(1),
    environment: EnvironmentSchema,
});
export const ConfigSchema = z.object({
    active_profile: z.string().nullable(),
    profiles: z.record(z.string(), ProfileSchema),
});
export const DEFAULT_CONFIG = {
    active_profile: null,
    profiles: {},
};
export const CONFIG_DIR = '.eduzz-mcp';
export const CONFIG_FILE = 'config.json';
//# sourceMappingURL=types.js.map