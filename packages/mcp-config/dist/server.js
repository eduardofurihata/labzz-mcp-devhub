import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ConfigManager } from './config-manager.js';
import { EnvironmentSchema } from './types.js';
export function createConfigServer() {
    const server = new McpServer({
        name: 'eduzz-config',
        version: '1.0.0',
    });
    const configManager = new ConfigManager();
    // Tool: List profiles
    server.tool('eduzz_profile_list', 'List all configured Eduzz profiles', {}, async () => {
        const profiles = configManager.listProfiles();
        if (profiles.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No profiles configured. Use eduzz_profile_create to add a profile.',
                    },
                ],
            };
        }
        const profileList = profiles
            .map((p) => {
            const activeMarker = p.isActive ? ' (active)' : '';
            return `- ${p.name}${activeMarker}: ${p.environment}`;
        })
            .join('\n');
        return {
            content: [
                {
                    type: 'text',
                    text: `Configured profiles:\n${profileList}`,
                },
            ],
        };
    });
    // Tool: Switch profile
    server.tool('eduzz_profile_switch', 'Switch to a different Eduzz profile', {
        name: z.string().describe('Name of the profile to switch to'),
    }, async ({ name }) => {
        try {
            configManager.switchProfile(name);
            const profile = configManager.getProfile(name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Switched to profile "${name}" (${profile?.environment})`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Create profile
    server.tool('eduzz_profile_create', 'Create a new Eduzz profile with API credentials', {
        name: z.string().describe('Unique name for the profile'),
        api_key: z.string().describe('Eduzz API key'),
        api_secret: z.string().describe('Eduzz API secret'),
        environment: EnvironmentSchema.describe('Environment: sandbox or production'),
    }, async ({ name, api_key, api_secret, environment }) => {
        try {
            configManager.createProfile(name, api_key, api_secret, environment);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Profile "${name}" created successfully (${environment})`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Delete profile
    server.tool('eduzz_profile_delete', 'Delete an Eduzz profile', {
        name: z.string().describe('Name of the profile to delete'),
    }, async ({ name }) => {
        try {
            configManager.deleteProfile(name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Profile "${name}" deleted successfully`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Get active profile info
    server.tool('eduzz_profile_active', 'Get information about the currently active profile', {}, async () => {
        const active = configManager.getActiveProfile();
        if (!active) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No active profile. Use eduzz_profile_create to add a profile.',
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Active profile: ${active.name}\nEnvironment: ${active.profile.environment}\nAPI Key: ${active.profile.api_key.substring(0, 8)}...`,
                },
            ],
        };
    });
    return server;
}
export async function startServer() {
    const server = createConfigServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map