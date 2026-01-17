/**
 * Vercel Serverless Function for OpenCode Docs MCP Server
 * Deploy to Vercel for a hosted remote MCP server
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Embedded minimal docs for serverless (avoid scraping on cold start)
const EMBEDDED_DOCS = {
  pages: [
    {
      path: '/docs/',
      title: 'OpenCode Documentation',
      url: 'https://opencode.ai/docs/',
      category: 'Getting Started',
      content: `# OpenCode Documentation

OpenCode is an open source AI coding agent. Available as TUI, desktop app, or IDE extension.

## Quick Start
\`\`\`bash
curl -fsSL https://opencode.ai/install | bash
opencode
/init
\`\`\`

## Key Features
- Terminal UI (TUI) with Plan/Build modes
- MCP server support for external tools
- GitHub/GitLab integration
- Custom agents and tools
- Multiple LLM provider support

Visit https://opencode.ai/docs/ for full documentation.`,
    },
    {
      path: '/docs/mcp-servers/',
      title: 'MCP servers',
      url: 'https://opencode.ai/docs/mcp-servers/',
      category: 'Configure',
      content: `# MCP servers

Add external tools to OpenCode using the Model Context Protocol (MCP).

## Local MCP Server
\`\`\`json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-package"]
    }
  }
}
\`\`\`

## Remote MCP Server
\`\`\`json
{
  "mcp": {
    "my-server": {
      "type": "remote",
      "url": "https://mcp.example.com/sse"
    }
  }
}
\`\`\`

Full docs: https://opencode.ai/docs/mcp-servers/`,
    },
  ],
  version: '1.0.0',
  updatedAt: Date.now(),
  baseUrl: 'https://opencode.ai/docs',
};

function searchDocs(query: string, limit = 5) {
  const q = query.toLowerCase();
  return EMBEDDED_DOCS.pages
    .filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.content.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(p => ({
      title: p.title,
      url: p.url,
      category: p.category,
      snippet: p.content.slice(0, 200) + '...',
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  const path = req.url?.split('?')[0] || '/';
  
  // Health check / info
  if (path === '/' || path === '/api' || path === '/api/') {
    return res.json({
      name: 'opencode-docs-mcp',
      version: '1.0.0',
      description: 'MCP server for searching OpenCode documentation',
      endpoints: {
        '/api/search': 'Search documentation (GET ?q=query)',
        '/api/page': 'Get page content (GET ?path=/docs/...)',
        '/api/list': 'List all pages',
      },
      mcp: {
        note: 'For full MCP protocol support, use the npm package: npx opencode-docs-mcp',
      },
      docs: 'https://opencode.ai/docs/',
    });
  }
  
  // Search endpoint
  if (path === '/api/search') {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 5;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter: q' });
    }
    
    const results = searchDocs(query, limit);
    return res.json({ query, results, count: results.length });
  }
  
  // Get specific page
  if (path === '/api/page') {
    const pagePath = (req.query.path as string) || '';
    const page = EMBEDDED_DOCS.pages.find(p => 
      p.path === pagePath || p.path === pagePath + '/'
    );
    
    if (!page) {
      return res.status(404).json({ 
        error: 'Page not found',
        available: EMBEDDED_DOCS.pages.map(p => p.path),
      });
    }
    
    return res.json(page);
  }
  
  // List all pages
  if (path === '/api/list') {
    return res.json({
      pages: EMBEDDED_DOCS.pages.map(p => ({
        path: p.path,
        title: p.title,
        url: p.url,
        category: p.category,
      })),
      count: EMBEDDED_DOCS.pages.length,
    });
  }
  
  return res.status(404).json({ error: 'Not found' });
}
