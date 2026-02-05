import { z } from 'zod';
export const CrawlerConfigSchema = z.object({
    baseUrl: z.string().url().default('https://developers.eduzz.com/'),
    maxDepth: z.number().int().positive().default(10000),
    domainFilter: z.string().default('developers.eduzz.com'),
    concurrency: z.number().int().positive().default(5),
    delay: z.number().int().nonnegative().default(500),
});
export const DEFAULT_CRAWLER_CONFIG = {
    baseUrl: 'https://developers.eduzz.com/',
    maxDepth: 10000,
    domainFilter: 'developers.eduzz.com',
    concurrency: 5,
    delay: 500,
};
//# sourceMappingURL=types.js.map