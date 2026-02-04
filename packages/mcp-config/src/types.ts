import { z } from 'zod';

export const EnvironmentSchema = z.enum(['sandbox', 'production']);
export type Environment = z.infer<typeof EnvironmentSchema>;

export const ProfileSchema = z.object({
  api_key: z.string().min(1),
  api_secret: z.string().min(1),
  environment: EnvironmentSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ConfigSchema = z.object({
  active_profile: z.string().nullable(),
  profiles: z.record(z.string(), ProfileSchema),
});
export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  active_profile: null,
  profiles: {},
};

export const CONFIG_DIR = '.eduzz-mcp';
export const CONFIG_FILE = 'config.json';

export interface ProfileInfo {
  name: string;
  environment: Environment;
  isActive: boolean;
}
