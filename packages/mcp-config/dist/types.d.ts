import { z } from 'zod';
export declare const EnvironmentSchema: z.ZodEnum<["sandbox", "production"]>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export declare const ProfileSchema: z.ZodObject<{
    api_key: z.ZodString;
    api_secret: z.ZodString;
    environment: z.ZodEnum<["sandbox", "production"]>;
}, "strip", z.ZodTypeAny, {
    api_key: string;
    api_secret: string;
    environment: "sandbox" | "production";
}, {
    api_key: string;
    api_secret: string;
    environment: "sandbox" | "production";
}>;
export type Profile = z.infer<typeof ProfileSchema>;
export declare const ConfigSchema: z.ZodObject<{
    active_profile: z.ZodNullable<z.ZodString>;
    profiles: z.ZodRecord<z.ZodString, z.ZodObject<{
        api_key: z.ZodString;
        api_secret: z.ZodString;
        environment: z.ZodEnum<["sandbox", "production"]>;
    }, "strip", z.ZodTypeAny, {
        api_key: string;
        api_secret: string;
        environment: "sandbox" | "production";
    }, {
        api_key: string;
        api_secret: string;
        environment: "sandbox" | "production";
    }>>;
}, "strip", z.ZodTypeAny, {
    active_profile: string | null;
    profiles: Record<string, {
        api_key: string;
        api_secret: string;
        environment: "sandbox" | "production";
    }>;
}, {
    active_profile: string | null;
    profiles: Record<string, {
        api_key: string;
        api_secret: string;
        environment: "sandbox" | "production";
    }>;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const DEFAULT_CONFIG: Config;
export declare const CONFIG_DIR = ".eduzz-mcp";
export declare const CONFIG_FILE = "config.json";
export interface ProfileInfo {
    name: string;
    environment: Environment;
    isActive: boolean;
}
//# sourceMappingURL=types.d.ts.map