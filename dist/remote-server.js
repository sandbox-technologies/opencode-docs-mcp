/**
 * Remote MCP Server using SSE transport for Vercel/Cloudflare deployment
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerDocTools } from './tools.js';
import { registerDocResources } from './resources.js';
import { scrapeAllDocs } from './scraper.js';
import * as http from 'http';
import * as url from 'url';
let docsIndex = null;
let lastRefresh = 0;
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
async function ensureIndex() {
    const now = Date.now();
    if (!docsIndex || (now - lastRefresh > REFRESH_INTERVAL)) {
        console.log('Refreshing documentation index...');
        try {
            docsIndex = await scrapeAllDocs();
            lastRefresh = now;
            console.log(`Loaded ${docsIndex.pages.length} pages`);
        }
        catch (error) {
            console.error('Failed to refresh index:', error);
            if (!docsIndex) {
                // Create minimal fallback
                docsIndex = {
                    pages: [{
                            path: '/docs/',
                            title: 'OpenCode Documentation',
                            url: 'https://opencode.ai/docs/',
                            content: 'Visit https://opencode.ai/docs/ for full documentation.',
                            headings: [],
                            category: 'General',
                            scrapedAt: Date.now(),
                        }],
                    version: '1.0.0-fallback',
                    updatedAt: Date.now(),
                    baseUrl: 'https://opencode.ai/docs',
                };
            }
        }
    }
    return docsIndex;
}
// Store active transports for cleanup
const transports = new Map();
export function createServer() {
    return http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        // Health check
        if (pathname === '/health' || pathname === '/') {
            await ensureIndex();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                name: 'opencode-docs-mcp',
                version: '1.0.0',
                pages: docsIndex?.pages.length || 0,
                lastUpdated: docsIndex?.updatedAt,
            }));
            return;
        }
        // SSE endpoint for MCP
        if (pathname === '/sse' || pathname === '/mcp') {
            console.log('New SSE connection');
            // Ensure docs are loaded
            await ensureIndex();
            // Create MCP server for this connection
            const server = new McpServer({
                name: 'opencode-docs',
                version: '1.0.0',
            });
            registerDocTools(server, () => docsIndex);
            registerDocResources(server, () => docsIndex);
            // Create SSE transport
            const transport = new SSEServerTransport('/messages', res);
            const sessionId = Math.random().toString(36).substring(7);
            transports.set(sessionId, transport);
            // Handle client disconnect
            req.on('close', () => {
                console.log('SSE connection closed');
                transports.delete(sessionId);
            });
            await server.connect(transport);
            return;
        }
        // Message endpoint for SSE
        if (pathname === '/messages' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    // Find the transport and send message
                    // This is a simplified version - in production you'd need session management
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'received' }));
                }
                catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Internal error' }));
                }
            });
            return;
        }
        // 404 for unknown routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Not found',
            endpoints: {
                '/': 'Health check',
                '/sse': 'SSE endpoint for MCP connections',
                '/mcp': 'Alias for /sse',
            }
        }));
    });
}
// Run if called directly
if (process.argv[1]?.includes('remote-server')) {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const server = createServer();
    server.listen(PORT, () => {
        console.log(`OpenCode Docs MCP Server running on http://localhost:${PORT}`);
        console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    });
}
