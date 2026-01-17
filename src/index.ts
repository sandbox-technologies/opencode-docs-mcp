#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerDocTools } from './tools.js';
import { registerDocResources } from './resources.js';
import { loadIndex, scrapeAllDocs, saveIndex } from './scraper.js';
import { DocsIndex } from './types.js';
import * as path from 'path';
import * as fs from 'fs';

// Default index path
const getIndexPath = (): string => {
  // Check environment variable first
  if (process.env.OPENCODE_DOCS_INDEX) {
    return process.env.OPENCODE_DOCS_INDEX;
  }
  
  // Default to data directory in package
  const packageDir = path.dirname(new URL(import.meta.url).pathname);
  return path.join(packageDir, '..', 'data', 'docs-index.json');
};

let docsIndex: DocsIndex | null = null;

async function initializeIndex(): Promise<void> {
  const indexPath = getIndexPath();
  
  // Try to load existing index
  docsIndex = loadIndex(indexPath);
  
  if (docsIndex) {
    const ageHours = (Date.now() - docsIndex.updatedAt) / (1000 * 60 * 60);
    console.error(`Loaded docs index (${docsIndex.pages.length} pages, ${ageHours.toFixed(1)}h old)`);
    
    // Refresh if older than 24 hours
    if (ageHours > 24) {
      console.error('Index is stale, refreshing in background...');
      refreshIndex().catch(console.error);
    }
  } else {
    console.error('No index found, scraping docs...');
    await refreshIndex();
  }
}

async function refreshIndex(): Promise<void> {
  try {
    docsIndex = await scrapeAllDocs();
    const indexPath = getIndexPath();
    await saveIndex(docsIndex, indexPath);
    console.error(`Refreshed index: ${docsIndex.pages.length} pages`);
  } catch (error) {
    console.error('Failed to refresh index:', error);
    
    // If we have no index at all, create a minimal embedded one
    if (!docsIndex) {
      docsIndex = createFallbackIndex();
    }
  }
}

function createFallbackIndex(): DocsIndex {
  // Minimal embedded index for when scraping fails
  return {
    pages: [
      {
        path: '/docs/',
        title: 'OpenCode Documentation',
        url: 'https://opencode.ai/docs/',
        content: `# OpenCode Documentation

OpenCode is an open source AI coding agent. It's available as a terminal-based interface, desktop app, or IDE extension.

## Installation

\`\`\`bash
curl -fsSL https://opencode.ai/install | bash
\`\`\`

## Key Features

- Terminal-based UI (TUI)
- CLI for automation
- IDE extension
- MCP server support
- Custom tools and agents
- GitHub and GitLab integration

For full documentation, visit https://opencode.ai/docs/`,
        headings: [
          { level: 1, text: 'OpenCode Documentation', id: 'opencode-documentation' },
          { level: 2, text: 'Installation', id: 'installation' },
          { level: 2, text: 'Key Features', id: 'key-features' },
        ],
        category: 'General',
        scrapedAt: Date.now(),
      },
    ],
    version: '1.0.0-fallback',
    updatedAt: Date.now(),
    baseUrl: 'https://opencode.ai/docs',
  };
}

async function main(): Promise<void> {
  try {
    // Initialize the docs index
    await initializeIndex();
    
    // Create MCP server
    const server = new McpServer({
      name: 'opencode-docs',
      version: '1.0.0',
    });
    
    // Register tools and resources
    registerDocTools(server, () => docsIndex);
    registerDocResources(server, () => docsIndex);
    
    // Create transport
    const transport = new StdioServerTransport();
    
    // Connect
    await server.connect(transport);
    
    console.error('OpenCode Docs MCP Server running on stdio');
    console.error(`Tools: search_opencode_docs, get_opencode_doc_page, list_opencode_docs_by_category, list_opencode_doc_categories, browse_opencode_docs`);
    
    // Keep process running
    process.stdin.resume();
    
    process.on('SIGINT', () => {
      console.error('Shutting down...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
