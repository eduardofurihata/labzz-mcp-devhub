// src/server.ts
import { McpServer as McpServer4 } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport as StdioServerTransport4 } from "@modelcontextprotocol/sdk/server/stdio.js";

// packages/mcp-config/dist/config-manager.js
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// packages/mcp-config/dist/types.js
import { z } from "zod";
var EnvironmentSchema = z.enum(["sandbox", "production"]);
var ProfileSchema = z.object({
  api_key: z.string().min(1),
  api_secret: z.string().min(1),
  environment: EnvironmentSchema
});
var ConfigSchema = z.object({
  active_profile: z.string().nullable(),
  profiles: z.record(z.string(), ProfileSchema)
});
var DEFAULT_CONFIG = {
  active_profile: null,
  profiles: {}
};
var CONFIG_DIR = ".eduzz-mcp";
var CONFIG_FILE = "config.json";

// packages/mcp-config/dist/config-manager.js
var ConfigManager = class {
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
      const content = readFileSync(this.configPath, "utf-8");
      const parsed = JSON.parse(content);
      return ConfigSchema.parse(parsed);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  saveConfig(config) {
    writeFileSync(this.configPath, JSON.stringify(config, null, 2), "utf-8");
    this.config = config;
  }
  getConfigDir() {
    return join(homedir(), CONFIG_DIR);
  }
  listProfiles() {
    return Object.entries(this.config.profiles).map(([name, profile]) => ({
      name,
      environment: profile.environment,
      isActive: this.config.active_profile === name
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
          environment
        }
      }
    };
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
          ...updates
        }
      }
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
      active_profile: this.config.active_profile === name ? Object.keys(remainingProfiles)[0] || null : this.config.active_profile
    };
    this.saveConfig(newConfig);
  }
  switchProfile(name) {
    if (!this.config.profiles[name]) {
      throw new Error(`Profile "${name}" does not exist`);
    }
    const newConfig = {
      ...this.config,
      active_profile: name
    };
    this.saveConfig(newConfig);
  }
  hasProfiles() {
    return Object.keys(this.config.profiles).length > 0;
  }
};

// packages/mcp-config/dist/server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z as z2 } from "zod";
function registerConfigTools(server, configManager) {
  server.tool("eduzz_profile_list", "List all configured Eduzz profiles", {}, async () => {
    const profiles = configManager.listProfiles();
    if (profiles.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No profiles configured. Use eduzz_profile_create to add a profile."
          }
        ]
      };
    }
    const profileList = profiles.map((p) => {
      const activeMarker = p.isActive ? " (active)" : "";
      return `- ${p.name}${activeMarker}: ${p.environment}`;
    }).join("\n");
    return {
      content: [
        {
          type: "text",
          text: `Configured profiles:
${profileList}`
        }
      ]
    };
  });
  server.tool("eduzz_profile_switch", "Switch to a different Eduzz profile", {
    name: z2.string().describe("Name of the profile to switch to")
  }, async ({ name }) => {
    try {
      configManager.switchProfile(name);
      const profile = configManager.getProfile(name);
      return {
        content: [
          {
            type: "text",
            text: `Switched to profile "${name}" (${profile?.environment})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_profile_create", "Create a new Eduzz profile with API credentials", {
    name: z2.string().describe("Unique name for the profile"),
    api_key: z2.string().describe("Eduzz API key"),
    api_secret: z2.string().describe("Eduzz API secret"),
    environment: EnvironmentSchema.describe("Environment: sandbox or production")
  }, async ({ name, api_key, api_secret, environment }) => {
    try {
      configManager.createProfile(name, api_key, api_secret, environment);
      return {
        content: [
          {
            type: "text",
            text: `Profile "${name}" created successfully (${environment})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_profile_delete", "Delete an Eduzz profile", {
    name: z2.string().describe("Name of the profile to delete")
  }, async ({ name }) => {
    try {
      configManager.deleteProfile(name);
      return {
        content: [
          {
            type: "text",
            text: `Profile "${name}" deleted successfully`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_profile_active", "Get information about the currently active profile", {}, async () => {
    const active = configManager.getActiveProfile();
    if (!active) {
      return {
        content: [
          {
            type: "text",
            text: "No active profile. Use eduzz_profile_create to add a profile."
          }
        ]
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Active profile: ${active.name}
Environment: ${active.profile.environment}
API Key: ${active.profile.api_key.substring(0, 8)}...`
        }
      ]
    };
  });
}

// packages/mcp-knowledge/dist/server.js
import { McpServer as McpServer2 } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport as StdioServerTransport2 } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z as z4 } from "zod";
import { join as join7 } from "node:path";
import { existsSync as existsSync8, readFileSync as readFileSync5, readdirSync } from "node:fs";
import cron from "node-cron";

// packages/mcp-knowledge/dist/embeddings/local-embeddings.js
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join2 } from "node:path";
import { createHash } from "node:crypto";
var embedder = null;
var LocalEmbeddings = class {
  storagePath;
  dbPath;
  modelName;
  db;
  initialized = false;
  constructor(config) {
    this.storagePath = config.storagePath;
    this.dbPath = join2(config.storagePath, "knowledge.db.json");
    this.modelName = config.modelName || "Xenova/all-MiniLM-L6-v2";
    if (!existsSync2(this.storagePath)) {
      mkdirSync2(this.storagePath, { recursive: true });
    }
    this.db = this.loadDatabase();
  }
  loadDatabase() {
    if (existsSync2(this.dbPath)) {
      try {
        const content = readFileSync2(this.dbPath, "utf-8");
        return JSON.parse(content);
      } catch {
        return this.createEmptyDatabase();
      }
    }
    return this.createEmptyDatabase();
  }
  createEmptyDatabase() {
    return {
      documents: [],
      version: "1.0.0",
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  saveDatabase() {
    this.db.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    writeFileSync2(this.dbPath, JSON.stringify(this.db, null, 2), "utf-8");
  }
  async initialize() {
    if (this.initialized)
      return;
    console.log("Loading local embedding model (first run may take a moment to download)...");
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", this.modelName, {
      quantized: true
      // Use quantized model for faster inference
    });
    this.initialized = true;
    console.log("Embedding model loaded successfully!");
  }
  async generateEmbedding(text) {
    if (!embedder) {
      throw new Error("Embedder not initialized. Call initialize() first.");
    }
    const result = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(result.data);
  }
  async generateEmbeddings(texts) {
    const embeddings = [];
    for (let i = 0; i < texts.length; i++) {
      const embedding = await this.generateEmbedding(texts[i]);
      embeddings.push(embedding);
      if (texts.length > 10 && (i + 1) % 10 === 0) {
        console.log(`Embedding progress: ${i + 1}/${texts.length}`);
      }
    }
    return embeddings;
  }
  generateChunkId(content, metadata) {
    const hash = createHash("md5").update(content + JSON.stringify(metadata)).digest("hex");
    return hash.substring(0, 16);
  }
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  chunkText(text, maxTokens = 500) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = "";
    let currentTokens = 0;
    for (const sentence of sentences) {
      const sentenceTokens = Math.ceil(sentence.length / 4);
      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
        currentTokens = 0;
      }
      currentChunk += sentence + " ";
      currentTokens += sentenceTokens;
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
  async addDocument(content, metadata) {
    await this.initialize();
    const chunks = this.chunkText(content);
    const ids = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkMetadata = {
        ...metadata,
        section: `${metadata.section}_chunk_${i}`
      };
      const id = this.generateChunkId(chunk, chunkMetadata);
      if (this.db.documents.some((d) => d.id === id)) {
        ids.push(id);
        continue;
      }
      const embedding = await this.generateEmbedding(chunk);
      this.db.documents.push({
        id,
        content: chunk,
        metadata: chunkMetadata,
        embedding
      });
      ids.push(id);
    }
    this.saveDatabase();
    return ids;
  }
  async addChunks(chunks) {
    await this.initialize();
    const newChunks = chunks.filter((c) => !this.db.documents.some((d) => d.id === c.id));
    if (newChunks.length === 0)
      return;
    console.log(`Generating embeddings for ${newChunks.length} chunks...`);
    const embeddings = await this.generateEmbeddings(newChunks.map((c) => c.content));
    for (let i = 0; i < newChunks.length; i++) {
      this.db.documents.push({
        id: newChunks[i].id,
        content: newChunks[i].content,
        metadata: newChunks[i].metadata,
        embedding: embeddings[i]
      });
    }
    this.saveDatabase();
  }
  async search(query, options = {}) {
    await this.initialize();
    const { limit = 10, filter } = options;
    const queryEmbedding = await this.generateEmbedding(query);
    let candidates = this.db.documents;
    if (filter) {
      candidates = candidates.filter((doc) => {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== void 0 && doc.metadata[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    const scored = candidates.map((doc) => ({
      ...doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    const topResults = scored.slice(0, limit);
    return topResults.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      distance: 1 - doc.similarity
      // Convert similarity to distance
    }));
  }
  deleteByUrl(url) {
    this.db.documents = this.db.documents.filter((d) => d.metadata.url !== url);
    this.saveDatabase();
  }
  clear() {
    this.db = this.createEmptyDatabase();
    this.saveDatabase();
  }
  count() {
    return this.db.documents.length;
  }
};

// packages/mcp-knowledge/dist/processors/openapi.js
import { readFileSync as readFileSync3, writeFileSync as writeFileSync3, existsSync as existsSync3 } from "node:fs";
import { join as join3 } from "node:path";
var OpenAPIProcessor = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async fetchSpec(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch OpenAPI spec from ${url}: ${response.status}`);
        return null;
      }
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();
      if (contentType.includes("yaml") || url.endsWith(".yaml") || url.endsWith(".yml")) {
        return JSON.parse(text);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error(`Error fetching OpenAPI spec from ${url}:`, error);
      return null;
    }
  }
  parseEndpoints(spec) {
    const endpoints = [];
    if (!spec.paths) {
      return endpoints;
    }
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
          const op = operation;
          const parameters = (op.parameters || []).map((p) => ({
            name: p.name,
            in: p.in,
            required: p.required || false,
            description: p.description || "",
            schema: p.schema || {}
          }));
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: op.summary || "",
            description: op.description || "",
            parameters,
            requestBody: op.requestBody,
            responses: op.responses || {}
          });
        }
      }
    }
    return endpoints;
  }
  async processSpec(url) {
    const spec = await this.fetchSpec(url);
    if (!spec) {
      return null;
    }
    const endpoints = this.parseEndpoints(spec);
    const result = {
      url,
      spec,
      endpoints
    };
    const specPath = join3(this.outputDir, "raw", "openapi", "spec.json");
    writeFileSync3(specPath, JSON.stringify(result, null, 2), "utf-8");
    return result;
  }
  loadCachedSpec() {
    const specPath = join3(this.outputDir, "raw", "openapi", "spec.json");
    if (!existsSync3(specPath)) {
      return null;
    }
    try {
      const content = readFileSync3(specPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  getEndpointDoc(spec, path, method) {
    const normalizedPath = path.toLowerCase();
    const normalizedMethod = method?.toUpperCase();
    for (const endpoint of spec.endpoints) {
      const endpointPath = endpoint.path.toLowerCase();
      if (endpointPath === normalizedPath) {
        if (!normalizedMethod || endpoint.method === normalizedMethod) {
          return endpoint;
        }
      }
      const pattern = endpointPath.replace(/\{[^}]+\}/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(normalizedPath)) {
        if (!normalizedMethod || endpoint.method === normalizedMethod) {
          return endpoint;
        }
      }
    }
    return null;
  }
  generateToolSchema(endpoint) {
    const properties = {};
    const required = [];
    for (const param of endpoint.parameters) {
      properties[param.name] = {
        ...param.schema,
        description: param.description
      };
      if (param.required) {
        required.push(param.name);
      }
    }
    if (endpoint.requestBody) {
      const body = endpoint.requestBody;
      const jsonContent = body.content?.["application/json"];
      if (jsonContent?.schema) {
        properties.body = jsonContent.schema;
        if (body.required) {
          required.push("body");
        }
      }
    }
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : void 0
    };
  }
};

// packages/mcp-knowledge/dist/sync.js
import { existsSync as existsSync7, mkdirSync as mkdirSync5, rmSync } from "node:fs";
import { join as join6 } from "node:path";

// packages/mcp-knowledge/dist/scraper/crawler.js
import { chromium } from "playwright";
import { existsSync as existsSync4, mkdirSync as mkdirSync3, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join4 } from "node:path";
import { createHash as createHash2 } from "node:crypto";
import TurndownService from "turndown";

// packages/mcp-knowledge/dist/types.js
import { z as z3 } from "zod";
var CrawlerConfigSchema = z3.object({
  baseUrl: z3.string().url().default("https://developers.eduzz.com/"),
  maxDepth: z3.number().int().positive().default(1e4),
  domainFilter: z3.string().default("developers.eduzz.com"),
  concurrency: z3.number().int().positive().default(5),
  delay: z3.number().int().nonnegative().default(500)
});
var DEFAULT_CRAWLER_CONFIG = {
  baseUrl: "https://developers.eduzz.com/",
  maxDepth: 1e4,
  domainFilter: "developers.eduzz.com",
  concurrency: 5,
  delay: 500
};

// packages/mcp-knowledge/dist/scraper/crawler.js
var Crawler = class {
  config;
  browser = null;
  visited = /* @__PURE__ */ new Set();
  queue = [];
  turndown;
  outputDir;
  constructor(outputDir, config = {}) {
    this.config = { ...DEFAULT_CRAWLER_CONFIG, ...config };
    this.outputDir = outputDir;
    this.turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced"
    });
    const dirs = ["pages", "images", "code-examples", "openapi"];
    for (const dir of dirs) {
      const path = join4(outputDir, "raw", dir);
      if (!existsSync4(path)) {
        mkdirSync3(path, { recursive: true });
      }
    }
  }
  generateId(url) {
    return createHash2("md5").update(url).digest("hex").substring(0, 12);
  }
  normalizeUrl(url, baseUrl) {
    try {
      const parsed = new URL(url, baseUrl);
      if (!parsed.hostname.includes(this.config.domainFilter)) {
        return null;
      }
      parsed.hash = "";
      let normalized = parsed.toString();
      if (normalized.endsWith("/") && normalized !== this.config.baseUrl) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return null;
    }
  }
  async extractImages(page, pageUrl) {
    const images = [];
    const imgElements = await page.locator("img").all();
    for (const img of imgElements) {
      const src = await img.getAttribute("src");
      const alt = await img.getAttribute("alt") || "";
      if (src) {
        const imgUrl = this.normalizeUrl(src, pageUrl);
        if (imgUrl) {
          const id = this.generateId(imgUrl);
          const ext = imgUrl.split(".").pop()?.split("?")[0] || "png";
          const localPath = join4(this.outputDir, "raw", "images", `${id}.${ext}`);
          images.push({
            url: imgUrl,
            alt,
            localPath
          });
        }
      }
    }
    return images;
  }
  async extractCodeBlocks(page) {
    const codeBlocks = [];
    const codeElements = await page.locator("pre code, pre").all();
    for (const code of codeElements) {
      const text = await code.textContent();
      if (!text)
        continue;
      const className = await code.getAttribute("class") || "";
      let language = "text";
      const langMatch = className.match(/language-(\w+)|lang-(\w+)|(\w+)/);
      if (langMatch) {
        language = langMatch[1] || langMatch[2] || langMatch[3] || "text";
      }
      let context = "";
      try {
        const parentLocator = page.locator("pre code, pre").filter({ has: code }).locator("..");
        const prevSibling = parentLocator.locator("xpath=preceding-sibling::*[1]");
        if (await prevSibling.count() > 0) {
          const siblingText = await prevSibling.textContent();
          context = siblingText?.substring(0, 200) || "";
        }
      } catch {
      }
      codeBlocks.push({
        language,
        code: text.trim(),
        context
      });
    }
    return codeBlocks;
  }
  async extractLinks(page, pageUrl) {
    const links = [];
    const anchors = await page.locator("a[href]").all();
    for (const anchor of anchors) {
      const href = await anchor.getAttribute("href");
      if (href) {
        const normalized = this.normalizeUrl(href, pageUrl);
        if (normalized && !this.visited.has(normalized)) {
          links.push(normalized);
        }
      }
    }
    return [...new Set(links)];
  }
  async crawlPage(page, url) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 3e4 });
      const title = await page.title();
      const content = await page.content();
      const mainSelectors = ["main", "article", ".content", ".documentation", "#content"];
      let htmlContent = "";
      for (const selector of mainSelectors) {
        const mainContent = page.locator(selector).first();
        if (await mainContent.count() > 0) {
          htmlContent = await mainContent.innerHTML();
          break;
        }
      }
      if (!htmlContent) {
        htmlContent = await page.locator("body").innerHTML();
      }
      const markdown = this.turndown.turndown(htmlContent);
      const images = await this.extractImages(page, url);
      const codeBlocks = await this.extractCodeBlocks(page);
      const links = await this.extractLinks(page, url);
      return {
        url,
        title,
        content,
        markdown,
        images,
        codeBlocks,
        links,
        crawledAt: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return null;
    }
  }
  async downloadImage(url, localPath) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        writeFileSync4(localPath, Buffer.from(buffer));
      }
    } catch (error) {
      console.error(`Error downloading image ${url}:`, error);
    }
  }
  savePage(crawled) {
    const id = this.generateId(crawled.url);
    const mdPath = join4(this.outputDir, "raw", "pages", `${id}.md`);
    const mdContent = `---
url: ${crawled.url}
title: ${crawled.title}
crawledAt: ${crawled.crawledAt.toISOString()}
---

# ${crawled.title}

${crawled.markdown}
`;
    writeFileSync4(mdPath, mdContent, "utf-8");
    if (crawled.codeBlocks.length > 0) {
      const examplesPath = join4(this.outputDir, "raw", "code-examples", `${id}.json`);
      writeFileSync4(examplesPath, JSON.stringify({
        url: crawled.url,
        examples: crawled.codeBlocks
      }, null, 2), "utf-8");
    }
  }
  async crawl(onProgress) {
    const results = [];
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; EduzzMCPBot/1.0; +https://github.com/eduzz/mcp-knowledge)"
    });
    const page = await context.newPage();
    this.queue.push(this.config.baseUrl);
    let processedCount = 0;
    while (this.queue.length > 0 && processedCount < this.config.maxDepth) {
      const url = this.queue.shift();
      if (this.visited.has(url))
        continue;
      this.visited.add(url);
      if (onProgress) {
        onProgress(url, processedCount + 1);
      }
      const crawled = await this.crawlPage(page, url);
      if (crawled) {
        results.push(crawled);
        this.savePage(crawled);
        for (const img of crawled.images) {
          if (!existsSync4(img.localPath)) {
            await this.downloadImage(img.url, img.localPath);
          }
        }
        for (const link of crawled.links) {
          if (!this.visited.has(link) && !this.queue.includes(link)) {
            this.queue.push(link);
          }
        }
        processedCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, this.config.delay));
    }
    await this.browser.close();
    this.browser = null;
    return results;
  }
  async stop() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
};

// packages/mcp-knowledge/dist/processors/html.js
import TurndownService2 from "turndown";

// packages/mcp-knowledge/dist/processors/code.js
var CodeProcessor = class {
  languageAliases = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    cs: "csharp",
    "c#": "csharp",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    json5: "json"
  };
  normalizeLanguage(language) {
    const normalized = language.toLowerCase().trim();
    return this.languageAliases[normalized] || normalized;
  }
  categorizeCode(code, context) {
    const combined = (code + " " + context).toLowerCase();
    if (combined.includes("api_key") || combined.includes("api_secret") || combined.includes("authorization") || combined.includes("bearer") || combined.includes("token") || combined.includes("authenticate")) {
      return "authentication";
    }
    if (combined.includes("webhook") || combined.includes("callback") || combined.includes("notification") || combined.includes("postback")) {
      return "webhook";
    }
    if (combined.includes("catch") || combined.includes("error") || combined.includes("exception") || combined.includes("try {")) {
      return "error-handling";
    }
    if (combined.includes("fetch(") || combined.includes("axios") || combined.includes("httpclient") || combined.includes("request(") || combined.includes("/api/") || combined.includes("curl")) {
      return "api-call";
    }
    if (combined.includes("interface ") || combined.includes("type ") || combined.includes("class ") || combined.includes("struct ") || combined.includes("schema")) {
      return "data-model";
    }
    if (combined.includes("config") || combined.includes(".env") || combined.includes("settings") || combined.includes("environment")) {
      return "configuration";
    }
    if (combined.includes("example") || combined.includes("sample") || combined.includes("demo")) {
      return "example";
    }
    return "other";
  }
  processCodeBlocks(blocks) {
    return blocks.map((block) => ({
      language: this.normalizeLanguage(block.language),
      code: this.cleanCode(block.code),
      context: block.context,
      category: this.categorizeCode(block.code, block.context)
    }));
  }
  cleanCode(code) {
    let cleaned = code.trim();
    cleaned = cleaned.replace(/\r\n/g, "\n");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    return cleaned;
  }
  filterByLanguage(codes, languages) {
    const normalizedLangs = languages.map((l) => this.normalizeLanguage(l));
    return codes.filter((c) => normalizedLangs.includes(c.language));
  }
  filterByCategory(codes, categories) {
    return codes.filter((c) => categories.includes(c.category));
  }
};

// packages/mcp-knowledge/dist/processors/image.js
import { readFileSync as readFileSync4, writeFileSync as writeFileSync5, existsSync as existsSync5 } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync as mkdirSync4 } from "node:fs";
import Tesseract from "tesseract.js";
var ImageProcessor = class {
  worker = null;
  /**
   * Initialize Tesseract worker for OCR.
   * Downloads language data on first run (~15MB for por+eng).
   */
  async getWorker() {
    if (!this.worker) {
      console.log("Initializing OCR engine (first run downloads language data)...");
      this.worker = await Tesseract.createWorker(["por", "eng"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            process.stdout.write(`\rOCR progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
    }
    return this.worker;
  }
  /**
   * Terminate the OCR worker to free resources.
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
  /**
   * Extract text from image using Tesseract OCR (offline).
   */
  async extractTextWithOCR(imagePath) {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(imagePath);
      process.stdout.write("\n");
      return data.text.trim();
    } catch (error) {
      console.error(`OCR failed for ${imagePath}:`, error);
      return "";
    }
  }
  /**
   * Process images using offline OCR (Tesseract.js).
   * No API key required - runs 100% locally.
   */
  async processImages(images) {
    const descriptions = [];
    console.log(`Processing ${images.length} images with OCR...`);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const descriptionPath = img.localPath.replace(/\.[^.]+$/, ".description.md");
      console.log(`[${i + 1}/${images.length}] Processing: ${img.localPath}`);
      if (existsSync5(descriptionPath)) {
        const existingDescription = readFileSync4(descriptionPath, "utf-8");
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: existingDescription,
          alt: img.alt
        });
        continue;
      }
      if (!existsSync5(img.localPath)) {
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: img.alt || "Image not found",
          alt: img.alt
        });
        continue;
      }
      const ext = img.localPath.toLowerCase().split(".").pop();
      if (ext === "svg") {
        const title2 = img.alt || "SVG Image";
        const description2 = `# ${title2}

_SVG images cannot be processed with OCR_
`;
        const dir2 = dirname(descriptionPath);
        if (!existsSync5(dir2)) {
          mkdirSync4(dir2, { recursive: true });
        }
        writeFileSync5(descriptionPath, description2, "utf-8");
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: description2,
          alt: img.alt
        });
        continue;
      }
      const extractedText = await this.extractTextWithOCR(img.localPath);
      const title = img.alt || "Eduzz Documentation Image";
      let description = `# ${title}

`;
      if (extractedText) {
        description += `## Extracted Text

\`\`\`
${extractedText}
\`\`\`
`;
      } else {
        description += `## Extracted Text

_No text detected in image_
`;
      }
      const dir = dirname(descriptionPath);
      if (!existsSync5(dir)) {
        mkdirSync4(dir, { recursive: true });
      }
      writeFileSync5(descriptionPath, description, "utf-8");
      descriptions.push({
        url: img.url,
        localPath: img.localPath,
        description,
        alt: img.alt
      });
    }
    await this.terminate();
    return descriptions;
  }
  /**
   * Process images with AI vision API (optional enhancement).
   * Provides richer descriptions than OCR alone.
   * Requires either OpenAI or Anthropic API key.
   */
  async processImagesWithAI(images, options) {
    const descriptions = [];
    for (const img of images) {
      const descriptionPath = img.localPath.replace(/\.[^.]+$/, ".description.md");
      if (existsSync5(descriptionPath)) {
        const existingDescription = readFileSync4(descriptionPath, "utf-8");
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: existingDescription,
          alt: img.alt
        });
        continue;
      }
      if (!existsSync5(img.localPath)) {
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: img.alt || "Image not found",
          alt: img.alt
        });
        continue;
      }
      let description = img.alt || "Image from Eduzz documentation";
      if (options.openaiApiKey) {
        try {
          description = await this.describeWithOpenAI(img.localPath, img.alt, options.openaiApiKey);
        } catch (error) {
          console.error(`OpenAI vision failed for ${img.localPath}:`, error);
        }
      } else if (options.anthropicApiKey) {
        try {
          description = await this.describeWithClaude(img.localPath, img.alt, options.anthropicApiKey);
        } catch (error) {
          console.error(`Claude vision failed for ${img.localPath}:`, error);
        }
      }
      const dir = dirname(descriptionPath);
      if (!existsSync5(dir)) {
        mkdirSync4(dir, { recursive: true });
      }
      writeFileSync5(descriptionPath, description, "utf-8");
      descriptions.push({
        url: img.url,
        localPath: img.localPath,
        description,
        alt: img.alt
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return descriptions;
  }
  getMimeType(filePath) {
    const ext = filePath.toLowerCase().split(".").pop();
    const mimeTypes = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml"
    };
    return mimeTypes[ext || ""] || "image/png";
  }
  async describeWithOpenAI(imagePath, alt, apiKey) {
    const imageBuffer = readFileSync4(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = this.getMimeType(imagePath);
    const prompt = `Analyze this documentation image and provide:

1. **Title**: A brief descriptive title (use the alt text "${alt}" as reference if helpful)

2. **Extracted Text**: Extract ALL visible text from the image exactly as shown, preserving structure:
   - Menu items, labels, buttons
   - Form fields and their descriptions
   - Error messages, tooltips
   - Code snippets
   - Any other readable text

3. **Context**: Brief description of what the image shows (UI screen, diagram, code example, etc.)

Format the response as markdown with clear sections.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 1500
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || alt || "Unable to describe image";
  }
  async describeWithClaude(imagePath, alt, apiKey) {
    const imageBuffer = readFileSync4(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mediaType = this.getMimeType(imagePath);
    const prompt = `Analyze this documentation image and provide:

1. **Title**: A brief descriptive title (use the alt text "${alt}" as reference if helpful)

2. **Extracted Text**: Extract ALL visible text from the image exactly as shown, preserving structure:
   - Menu items, labels, buttons
   - Form fields and their descriptions
   - Error messages, tooltips
   - Code snippets
   - Any other readable text

3. **Context**: Brief description of what the image shows (UI screen, diagram, code example, etc.)

Format the response as markdown with clear sections.`;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Image }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text || alt || "Unable to describe image";
  }
};

// packages/mcp-knowledge/dist/sync.js
import { createHash as createHash3 } from "node:crypto";

// packages/mcp-knowledge/dist/paths.js
import { homedir as homedir2 } from "node:os";
import { join as join5, dirname as dirname2 } from "node:path";
import { existsSync as existsSync6 } from "node:fs";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname2(__filename);
function getDataDir() {
  const projectDataDir = join5(__dirname, "..", "data");
  if (existsSync6(projectDataDir)) {
    return projectDataDir;
  }
  const bundledDataDir = join5(__dirname, "..", "packages", "mcp-knowledge", "data");
  if (existsSync6(bundledDataDir)) {
    return bundledDataDir;
  }
  return join5(homedir2(), ".eduzz-mcp");
}

// packages/mcp-knowledge/dist/sync.js
var KnowledgeSyncer = class {
  baseDir;
  codeProcessor;
  constructor() {
    this.baseDir = getDataDir();
    this.codeProcessor = new CodeProcessor();
    if (!existsSync7(this.baseDir)) {
      mkdirSync5(this.baseDir, { recursive: true });
    }
  }
  async sync(options = {}) {
    const { openaiApiKey, anthropicApiKey, onProgress } = options;
    const result = {
      pagesProcessed: 0,
      imagesProcessed: 0,
      codeExamplesProcessed: 0,
      chunksIndexed: 0,
      errors: []
    };
    const log = (msg) => {
      if (onProgress)
        onProgress(msg);
      console.log(msg);
    };
    try {
      log("Cleaning existing data...");
      const rawDir = join6(this.baseDir, "raw");
      if (existsSync7(rawDir)) {
        rmSync(rawDir, { recursive: true, force: true });
      }
      mkdirSync5(rawDir, { recursive: true });
      log("Starting crawl of developers.eduzz.com...");
      const crawler = new Crawler(this.baseDir);
      const pages = await crawler.crawl((url, count) => {
        log(`[${count}] Crawling: ${url}`);
      });
      result.pagesProcessed = pages.length;
      log(`Crawled ${pages.length} pages`);
      log("Processing images with OCR...");
      const imageProcessor = new ImageProcessor();
      const allImages = pages.flatMap((p) => p.images);
      if (allImages.length > 0) {
        if (openaiApiKey || anthropicApiKey) {
          log("Using AI for enhanced image descriptions...");
          await imageProcessor.processImagesWithAI(allImages, { openaiApiKey, anthropicApiKey });
          log(`Processed ${allImages.length} images with AI descriptions`);
        } else {
          await imageProcessor.processImages(allImages);
          log(`Processed ${allImages.length} images with OCR`);
        }
        result.imagesProcessed = allImages.length;
      }
      log("Looking for OpenAPI specs...");
      const openApiProcessor = new OpenAPIProcessor(this.baseDir);
      const openApiUrls = this.findOpenAPILinks(pages);
      for (const url of openApiUrls) {
        log(`Processing OpenAPI spec: ${url}`);
        await openApiProcessor.processSpec(url);
      }
      log("Indexing content for semantic search (using local embeddings)...");
      const embeddings = new LocalEmbeddings({
        storagePath: this.baseDir
      });
      log("Clearing existing index...");
      embeddings.clear();
      await embeddings.initialize();
      const chunks = this.createChunks(pages);
      await embeddings.addChunks(chunks);
      result.chunksIndexed = chunks.length;
      const codeChunks = this.createCodeChunks(pages);
      await embeddings.addChunks(codeChunks);
      result.codeExamplesProcessed = codeChunks.length;
      result.chunksIndexed += codeChunks.length;
      log(`Indexed ${result.chunksIndexed} chunks`);
      log("Sync complete!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(errorMsg);
      log(`Error during sync: ${errorMsg}`);
    }
    return result;
  }
  findOpenAPILinks(pages) {
    const openApiUrls = [];
    for (const page of pages) {
      const matches = page.markdown.matchAll(/https?:\/\/[^\s)]+(?:openapi|swagger|api-docs)[^\s)]*.(?:json|yaml|yml)/gi);
      for (const match of matches) {
        openApiUrls.push(match[0]);
      }
      for (const link of page.links) {
        if (link.includes("openapi") || link.includes("swagger") || link.includes("api-docs") || link.endsWith(".json") || link.endsWith(".yaml") || link.endsWith(".yml")) {
          openApiUrls.push(link);
        }
      }
    }
    return [...new Set(openApiUrls)];
  }
  createChunks(pages) {
    const chunks = [];
    for (const page of pages) {
      const url = page.url;
      const title = page.title;
      const sections = page.markdown.split(/(?=^#{1,3}\s)/m);
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section || section.length < 50)
          continue;
        const sectionTitle = section.match(/^#{1,3}\s+(.+)/)?.[1] || `section_${i}`;
        const id = createHash3("md5").update(url + section).digest("hex").substring(0, 16);
        const metadata = {
          url,
          type: "doc",
          section: sectionTitle,
          title
        };
        chunks.push({
          id,
          content: section,
          metadata
        });
      }
    }
    return chunks;
  }
  createCodeChunks(pages) {
    const chunks = [];
    for (const page of pages) {
      const processed = this.codeProcessor.processCodeBlocks(page.codeBlocks);
      for (const code of processed) {
        const id = createHash3("md5").update(page.url + code.code).digest("hex").substring(0, 16);
        const content = `${code.context}

\`\`\`${code.language}
${code.code}
\`\`\``;
        const metadata = {
          url: page.url,
          type: "example",
          section: code.category,
          language: code.language,
          title: page.title
        };
        chunks.push({
          id,
          content,
          metadata
        });
      }
    }
    return chunks;
  }
  getStoragePath() {
    return this.baseDir;
  }
};

// packages/mcp-knowledge/dist/server.js
function registerKnowledgeTools(server, config = {}) {
  const baseDir = getDataDir();
  const embeddings = new LocalEmbeddings({
    storagePath: baseDir
  });
  const openApiProcessor = new OpenAPIProcessor(baseDir);
  const syncer = new KnowledgeSyncer();
  server.tool("eduzz_search", "Search the Eduzz knowledge base using semantic search", {
    query: z4.string().describe("Search query"),
    type: z4.enum(["doc", "example", "api"]).optional().describe("Filter by content type"),
    language: z4.string().optional().describe("Filter code examples by programming language"),
    limit: z4.number().int().min(1).max(50).default(10).describe("Maximum number of results")
  }, async ({ query, type, language, limit }) => {
    try {
      const filter = {};
      if (type)
        filter.type = type;
      if (language)
        filter.language = language;
      const results = await embeddings.search(query, {
        limit,
        filter: Object.keys(filter).length > 0 ? filter : void 0
      });
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No results found. Try a different query or run eduzz_sync to update the knowledge base."
            }
          ]
        };
      }
      const formatted = results.map((r, i) => {
        const meta = r.metadata;
        return `## Result ${i + 1}
**URL:** ${meta.url}
**Type:** ${meta.type}
**Section:** ${meta.section}
${meta.language ? `**Language:** ${meta.language}
` : ""}
${r.content}
`;
      }).join("\n---\n\n");
      return {
        content: [
          {
            type: "text",
            text: formatted
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_get_example", "Get code examples for a specific topic", {
    topic: z4.string().describe('Topic to find examples for (e.g., "authentication", "webhooks")'),
    language: z4.string().optional().describe('Programming language filter (e.g., "javascript", "php")'),
    limit: z4.number().int().min(1).max(20).default(5).describe("Maximum number of examples")
  }, async ({ topic, language, limit }) => {
    try {
      const filter = { type: "example" };
      if (language)
        filter.language = language.toLowerCase();
      const results = await embeddings.search(topic, { limit, filter });
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No code examples found for "${topic}"${language ? ` in ${language}` : ""}.`
            }
          ]
        };
      }
      const examples = results.map((r, i) => {
        return `### Example ${i + 1} (${r.metadata.language || "unknown"})
Source: ${r.metadata.url}

${r.content}`;
      }).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text",
            text: examples
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_get_endpoint", "Get documentation for a specific API endpoint", {
    path: z4.string().describe('API endpoint path (e.g., "/invoices", "/users/{id}")'),
    method: z4.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("HTTP method")
  }, async ({ path, method }) => {
    try {
      const spec = openApiProcessor.loadCachedSpec();
      if (!spec) {
        return {
          content: [
            {
              type: "text",
              text: "OpenAPI spec not found. Run eduzz_sync to fetch the API documentation."
            }
          ]
        };
      }
      const endpoint = openApiProcessor.getEndpointDoc(spec, path, method);
      if (!endpoint) {
        return {
          content: [
            {
              type: "text",
              text: `Endpoint "${method || "any"} ${path}" not found in API documentation.`
            }
          ]
        };
      }
      const params = endpoint.parameters.map((p) => `  - \`${p.name}\` (${p.in}${p.required ? ", required" : ""}): ${p.description}`).join("\n");
      const doc = `# ${endpoint.method} ${endpoint.path}

**Summary:** ${endpoint.summary}

${endpoint.description}

## Parameters
${params || "No parameters"}

## Request Body
${endpoint.requestBody ? "```json\n" + JSON.stringify(endpoint.requestBody, null, 2) + "\n```" : "No request body"}

## Responses
${Object.entries(endpoint.responses).map(([code, resp]) => `### ${code}
${JSON.stringify(resp, null, 2)}`).join("\n\n")}
`;
      return {
        content: [
          {
            type: "text",
            text: doc
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_sync", "Synchronize the knowledge base by crawling the Eduzz documentation. WARNING: This deletes all existing data and rebuilds from scratch.", {}, async () => {
    try {
      const result = await syncer.sync({
        openaiApiKey: config.openaiApiKey,
        anthropicApiKey: config.anthropicApiKey,
        onProgress: (msg) => console.log(msg)
      });
      const summary = `Sync completed:
- Pages processed: ${result.pagesProcessed}
- Images processed: ${result.imagesProcessed}
- Code examples: ${result.codeExamplesProcessed}
- Chunks indexed: ${result.chunksIndexed}
${result.errors.length > 0 ? `
Errors:
${result.errors.join("\n")}` : ""}`;
      return {
        content: [
          {
            type: "text",
            text: summary
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_stats", "Get statistics about the knowledge base", {}, async () => {
    const count = embeddings.count();
    const spec = openApiProcessor.loadCachedSpec();
    const pagesDir = join7(baseDir, "raw", "pages");
    const imagesDir = join7(baseDir, "raw", "images");
    let pageCount = 0;
    let imageCount = 0;
    if (existsSync8(pagesDir)) {
      pageCount = readdirSync(pagesDir).filter((f) => f.endsWith(".md")).length;
    }
    if (existsSync8(imagesDir)) {
      imageCount = readdirSync(imagesDir).filter((f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")).length;
    }
    const stats = `Knowledge Base Statistics:
- Indexed chunks: ${count}
- Crawled pages: ${pageCount}
- Downloaded images: ${imageCount}
- API endpoints: ${spec?.endpoints.length || 0}
- Storage path: ${baseDir}`;
    return {
      content: [
        {
          type: "text",
          text: stats
        }
      ]
    };
  });
  server.resource("eduzz-docs-overview", "eduzz://docs/overview", async () => {
    const overviewPath = join7(baseDir, "raw", "pages");
    if (!existsSync8(overviewPath)) {
      return {
        contents: [
          {
            uri: "eduzz://docs/overview",
            mimeType: "text/markdown",
            text: "No documentation available. Run eduzz_sync to fetch the documentation."
          }
        ]
      };
    }
    const files = readdirSync(overviewPath);
    const indexFile = files.find((f) => f.includes("index") || f.includes("overview") || f.includes("getting-started"));
    if (indexFile) {
      const content = readFileSync5(join7(overviewPath, indexFile), "utf-8");
      return {
        contents: [
          {
            uri: "eduzz://docs/overview",
            mimeType: "text/markdown",
            text: content
          }
        ]
      };
    }
    const pageList = files.filter((f) => f.endsWith(".md")).map((f) => `- ${f.replace(".md", "")}`).join("\n");
    return {
      contents: [
        {
          uri: "eduzz://docs/overview",
          mimeType: "text/markdown",
          text: `# Available Documentation

${pageList}`
        }
      ]
    };
  });
  server.resource("eduzz-openapi-spec", "eduzz://openapi/spec.json", async () => {
    const spec = openApiProcessor.loadCachedSpec();
    if (!spec) {
      return {
        contents: [
          {
            uri: "eduzz://openapi/spec.json",
            mimeType: "application/json",
            text: JSON.stringify({ error: "OpenAPI spec not available" })
          }
        ]
      };
    }
    return {
      contents: [
        {
          uri: "eduzz://openapi/spec.json",
          mimeType: "application/json",
          text: JSON.stringify(spec.spec, null, 2)
        }
      ]
    };
  });
}
function setupKnowledgeCron(config = {}) {
  const syncer = new KnowledgeSyncer();
  const schedule = config.cronSchedule || "0 3 * * 0";
  cron.schedule(schedule, async () => {
    console.log("Running scheduled knowledge sync...");
    await syncer.sync({
      openaiApiKey: config.openaiApiKey,
      anthropicApiKey: config.anthropicApiKey
    });
  });
}

// packages/mcp-api/dist/server.js
import { McpServer as McpServer3 } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport as StdioServerTransport3 } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z as z6 } from "zod";
import { homedir as homedir3 } from "node:os";
import { join as join8 } from "node:path";
import { existsSync as existsSync9, readFileSync as readFileSync6 } from "node:fs";

// packages/mcp-api/dist/client.js
import { createHmac } from "node:crypto";

// packages/mcp-api/dist/types.js
var BASE_URLS = {
  sandbox: "https://api-sandbox.eduzz.com",
  production: "https://api.eduzz.com"
};

// packages/mcp-api/dist/client.js
var EduzzAPIClient = class {
  config;
  rateLimitInfo = null;
  constructor(config) {
    this.config = {
      timeout: 3e4,
      retryAttempts: 3,
      retryDelay: 1e3,
      ...config
    };
  }
  getBaseUrl() {
    return BASE_URLS[this.config.environment];
  }
  generateSignature(timestamp, body) {
    const payload = `${timestamp}${body}`;
    return createHmac("sha256", this.config.apiSecret).update(payload).digest("hex");
  }
  buildUrl(path, query) {
    const url = new URL(path, this.getBaseUrl());
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
  parseRateLimitHeaders(headers) {
    const remaining = headers.get("x-ratelimit-remaining");
    const limit = headers.get("x-ratelimit-limit");
    const reset = headers.get("x-ratelimit-reset");
    if (remaining && limit) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        limit: parseInt(limit, 10),
        resetAt: reset ? new Date(parseInt(reset, 10) * 1e3) : /* @__PURE__ */ new Date()
      };
    }
  }
  getRateLimitInfo() {
    return this.rateLimitInfo;
  }
  async request(options) {
    const { method, path, query, body, headers: customHeaders } = options;
    const url = this.buildUrl(path, query);
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const bodyString = body ? JSON.stringify(body) : "";
    const signature = this.generateSignature(timestamp, bodyString);
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Api-Key": this.config.apiKey,
      "X-Api-Timestamp": timestamp,
      "X-Api-Signature": signature,
      ...customHeaders
    };
    let lastError = null;
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
          const waitTime = this.rateLimitInfo.resetAt.getTime() - Date.now();
          if (waitTime > 0) {
            await this.delay(Math.min(waitTime, 6e4));
          }
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        const response = await fetch(url, {
          method,
          headers,
          body: bodyString || void 0,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        this.parseRateLimitHeaders(response.headers);
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        if (!response.ok) {
          let errorData;
          try {
            const errorBody = await response.json();
            errorData = {
              code: errorBody.code || `HTTP_${response.status}`,
              message: errorBody.message || response.statusText,
              details: errorBody.details
            };
          } catch {
            errorData = {
              code: `HTTP_${response.status}`,
              message: response.statusText
            };
          }
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(errorData.message);
            if (attempt < this.config.retryAttempts - 1) {
              const delay = this.config.retryDelay * Math.pow(2, attempt);
              await this.delay(delay);
              continue;
            }
          }
          return {
            success: false,
            error: errorData,
            statusCode: response.status,
            headers: responseHeaders
          };
        }
        const data = await response.json();
        return {
          success: true,
          data,
          statusCode: response.status,
          headers: responseHeaders
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }
    return {
      success: false,
      error: {
        code: "REQUEST_FAILED",
        message: lastError?.message || "Request failed after retries"
      },
      statusCode: 0,
      headers: {}
    };
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Convenience methods
  async get(path, query) {
    return this.request({ method: "GET", path, query });
  }
  async post(path, body) {
    return this.request({ method: "POST", path, body });
  }
  async put(path, body) {
    return this.request({ method: "PUT", path, body });
  }
  async patch(path, body) {
    return this.request({ method: "PATCH", path, body });
  }
  async delete(path) {
    return this.request({ method: "DELETE", path });
  }
};

// packages/mcp-api/dist/generator.js
import { z as z5 } from "zod";
var ToolGenerator = class {
  spec;
  client;
  constructor(spec, client) {
    this.spec = spec;
    this.client = client;
  }
  schemaToZod(schema) {
    if (!schema) {
      return z5.unknown();
    }
    if (schema.$ref) {
      const refPath = schema.$ref.split("/");
      const schemaName = refPath[refPath.length - 1];
      const refSchema = this.spec.components?.schemas?.[schemaName];
      return this.schemaToZod(refSchema);
    }
    switch (schema.type) {
      case "string":
        if (schema.enum) {
          return z5.enum(schema.enum);
        }
        if (schema.format === "date") {
          return z5.string().describe(schema.description || "Date string");
        }
        if (schema.format === "date-time") {
          return z5.string().describe(schema.description || "ISO 8601 datetime");
        }
        if (schema.format === "email") {
          return z5.string().email().describe(schema.description || "Email address");
        }
        return z5.string().describe(schema.description || "");
      case "integer":
      case "number":
        return z5.number().describe(schema.description || "");
      case "boolean":
        return z5.boolean().describe(schema.description || "");
      case "array":
        return z5.array(this.schemaToZod(schema.items)).describe(schema.description || "");
      case "object":
        if (!schema.properties) {
          return z5.record(z5.unknown()).describe(schema.description || "");
        }
        const shape = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const isRequired = schema.required?.includes(key);
          let zodType = this.schemaToZod(propSchema);
          if (!isRequired) {
            zodType = zodType.optional();
          }
          shape[key] = zodType;
        }
        return z5.object(shape).describe(schema.description || "");
      default:
        return z5.unknown();
    }
  }
  generateToolName(method, path, operationId) {
    if (operationId) {
      return `eduzz_${operationId.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
    }
    const cleanPath = path.replace(/^\//, "").replace(/\{[^}]+\}/g, "").replace(/\//g, "_").replace(/[^a-z0-9_]/gi, "").toLowerCase();
    return `eduzz_${cleanPath}_${method.toLowerCase()}`;
  }
  buildInputSchema(parameters, requestBody) {
    const shape = {};
    for (const param of parameters) {
      if (param.in === "path" || param.in === "query") {
        let zodType = this.schemaToZod(param.schema);
        if (param.description) {
          zodType = zodType.describe(param.description);
        }
        if (!param.required) {
          zodType = zodType.optional();
        }
        shape[param.name] = zodType;
      }
    }
    if (requestBody) {
      const jsonContent = requestBody.content?.["application/json"];
      if (jsonContent?.schema) {
        const bodySchema = this.schemaToZod(jsonContent.schema);
        if (!requestBody.required) {
          shape.body = bodySchema.optional();
        } else {
          shape.body = bodySchema;
        }
      }
    }
    return z5.object(shape);
  }
  generateTools() {
    const tools = [];
    if (!this.spec.paths) {
      return tools;
    }
    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
          continue;
        }
        const op = operation;
        const toolName = this.generateToolName(method, path, op.operationId);
        const description = op.summary || op.description || `${method.toUpperCase()} ${path}`;
        const inputSchema = this.buildInputSchema(op.parameters || [], op.requestBody);
        const tool = {
          name: toolName,
          description,
          inputSchema,
          handler: async (params) => {
            const typedParams = params;
            let finalPath = path;
            const queryParams = {};
            for (const param of op.parameters || []) {
              const value = typedParams[param.name];
              if (value !== void 0) {
                if (param.in === "path") {
                  finalPath = finalPath.replace(`{${param.name}}`, String(value));
                } else if (param.in === "query") {
                  queryParams[param.name] = value;
                }
              }
            }
            const response = await this.client.request({
              method: method.toUpperCase(),
              path: finalPath,
              query: Object.keys(queryParams).length > 0 ? queryParams : void 0,
              body: typedParams.body
            });
            return response;
          }
        };
        tools.push(tool);
      }
    }
    return tools;
  }
  generateToolsMap() {
    const tools = this.generateTools();
    return new Map(tools.map((t) => [t.name, t]));
  }
};

// packages/mcp-api/dist/server.js
function registerAPITools(server, config = {}) {
  const configManager = config.configManager || new ConfigManager();
  let currentClient = null;
  let generatedTools = /* @__PURE__ */ new Map();
  function getClient() {
    const activeProfile = configManager.getActiveProfile();
    if (!activeProfile) {
      throw new Error("No active profile. Use eduzz_profile_create to configure credentials.");
    }
    const clientConfig = {
      apiKey: activeProfile.profile.api_key,
      apiSecret: activeProfile.profile.api_secret,
      environment: activeProfile.profile.environment
    };
    if (currentClient) {
      return currentClient;
    }
    currentClient = new EduzzAPIClient(clientConfig);
    return currentClient;
  }
  function loadOpenAPISpec() {
    const specPath = join8(homedir3(), ".eduzz-mcp", "raw", "openapi", "spec.json");
    if (!existsSync9(specPath)) {
      return null;
    }
    try {
      const content = readFileSync6(specPath, "utf-8");
      const parsed = JSON.parse(content);
      return parsed.spec || null;
    } catch {
      return null;
    }
  }
  function initializeGeneratedTools() {
    const spec = loadOpenAPISpec();
    if (!spec) {
      return;
    }
    try {
      const client = getClient();
      const generator = new ToolGenerator(spec, client);
      generatedTools = generator.generateToolsMap();
    } catch {
    }
  }
  initializeGeneratedTools();
  server.tool("eduzz_api_call", "Make a generic API call to the Eduzz API", {
    method: z6.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
    path: z6.string().describe('API endpoint path (e.g., "/invoices", "/users/123")'),
    query: z6.record(z6.string()).optional().describe("Query parameters"),
    body: z6.unknown().optional().describe("Request body for POST/PUT/PATCH"),
    profile: z6.string().optional().describe("Profile name to use (defaults to active profile)")
  }, async ({ method, path, query, body, profile }) => {
    try {
      if (profile) {
        configManager.switchProfile(profile);
        currentClient = null;
      }
      const client = getClient();
      const response = await client.request({
        method,
        path,
        query,
        body
      });
      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `API Error: ${response.error?.code} - ${response.error?.message}`
            }
          ],
          isError: true
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  });
  server.tool("eduzz_api_endpoints", "List available API endpoints from the OpenAPI spec", {
    filter: z6.string().optional().describe("Filter endpoints by path or method")
  }, async ({ filter }) => {
    const spec = loadOpenAPISpec();
    if (!spec || !spec.paths) {
      return {
        content: [
          {
            type: "text",
            text: "No OpenAPI spec available. Run eduzz_sync from mcp-knowledge to fetch the API documentation."
          }
        ]
      };
    }
    const endpoints = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
          continue;
        }
        const op = operation;
        const line = `${method.toUpperCase().padEnd(7)} ${path} - ${op.summary || "No description"}`;
        if (!filter || line.toLowerCase().includes(filter.toLowerCase())) {
          endpoints.push(line);
        }
      }
    }
    return {
      content: [
        {
          type: "text",
          text: endpoints.length > 0 ? `Available API endpoints:

${endpoints.join("\n")}` : "No endpoints found matching the filter."
        }
      ]
    };
  });
  server.tool("eduzz_api_status", "Get the current API configuration status", {}, async () => {
    const activeProfile = configManager.getActiveProfile();
    if (!activeProfile) {
      return {
        content: [
          {
            type: "text",
            text: "No active profile configured. Use eduzz_profile_create to set up credentials."
          }
        ]
      };
    }
    const client = getClient();
    const rateLimit = client.getRateLimitInfo();
    let status = `API Status:
- Active Profile: ${activeProfile.name}
- Environment: ${activeProfile.profile.environment}
- API Key: ${activeProfile.profile.api_key.substring(0, 8)}...`;
    if (rateLimit) {
      status += `
- Rate Limit: ${rateLimit.remaining}/${rateLimit.limit}
- Resets at: ${rateLimit.resetAt.toISOString()}`;
    }
    const spec = loadOpenAPISpec();
    if (spec) {
      status += "\n- OpenAPI spec: Loaded";
      status += `
- Generated tools: ${generatedTools.size}`;
    } else {
      status += "\n- OpenAPI spec: Not available";
    }
    return {
      content: [
        {
          type: "text",
          text: status
        }
      ]
    };
  });
  server.tool("eduzz_api_reload", "Reload the API tools from the OpenAPI spec", {}, async () => {
    currentClient = null;
    initializeGeneratedTools();
    return {
      content: [
        {
          type: "text",
          text: `Reloaded ${generatedTools.size} API tools from OpenAPI spec.`
        }
      ]
    };
  });
  for (const [name, tool] of generatedTools) {
    server.tool(name, tool.description, tool.inputSchema instanceof z6.ZodObject ? tool.inputSchema.shape : {}, async (params) => {
      try {
        const result = await tool.handler(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            }
          ],
          isError: true
        };
      }
    });
  }
}

// src/server.ts
function createServer() {
  const server = new McpServer4({
    name: "eduzz-devhub",
    version: "2.0.0"
  });
  const configManager = new ConfigManager();
  registerConfigTools(server, configManager);
  const knowledgeConfig = {};
  registerKnowledgeTools(server, knowledgeConfig);
  registerAPITools(server, { configManager });
  setupKnowledgeCron(knowledgeConfig);
  return server;
}
async function startServer4() {
  const server = createServer();
  const transport = new StdioServerTransport4();
  await server.connect(transport);
}
export {
  ConfigManager,
  createServer,
  registerAPITools,
  registerConfigTools,
  registerKnowledgeTools,
  setupKnowledgeCron,
  startServer4 as startServer
};
//# sourceMappingURL=index.js.map
