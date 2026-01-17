import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DocsIndex } from './types.js';
import { 
  searchDocs, 
  getPageByPath, 
  listCategories,
  listAllPages 
} from './search.js';

// Mintlify-style tool definitions with detailed descriptions
const TOOL_DEFINITIONS = {
  SearchOpenCodeDocs: {
    name: 'SearchOpenCodeDocs',
    description: 'Search across the OpenCode knowledge base to find relevant information, configuration examples, CLI commands, and guides. Use this tool when you need to answer questions about OpenCode, find specific documentation, understand how features work, or locate implementation details for MCP servers, agents, tools, themes, and more. The search returns contextual content with titles and direct links to the documentation pages.',
    operationId: 'OpenCodeDefaultSearch',
  },
  GetOpenCodeDocPage: {
    name: 'GetOpenCodeDocPage', 
    description: 'Retrieve the full content of a specific OpenCode documentation page by its path. Use this when you need complete information from a known documentation page, such as /docs/mcp-servers/ for MCP configuration or /docs/agents/ for agent setup.',
    operationId: 'OpenCodeGetPage',
  },
  BrowseOpenCodeDocs: {
    name: 'BrowseOpenCodeDocs',
    description: 'Get a complete overview of the OpenCode documentation structure including all categories and pages. Use this to understand what documentation is available or to help users navigate to the right section.',
    operationId: 'OpenCodeBrowse',
  },
};

export function registerDocTools(server: McpServer, getIndex: () => DocsIndex | null): void {
  
  // Search docs tool (Mintlify-style)
  server.tool(
    TOOL_DEFINITIONS.SearchOpenCodeDocs.name,
    TOOL_DEFINITIONS.SearchOpenCodeDocs.description,
    {
      query: z.string().describe('A query to search the OpenCode documentation with. Be specific for better results.'),
    },
    async ({ query }) => {
      const index = getIndex();
      if (!index) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Documentation index not available. Please wait for initial scrape to complete.',
          }],
        };
      }
      
      const results = searchDocs(index, query, 5);
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No results found for "${query}". Try different keywords or use BrowseOpenCodeDocs to see all available documentation.`,
          }],
        };
      }
      
      const formattedResults = results.map((result, i) => {
        return `### ${i + 1}. [${result.page.title}](${result.page.url})
**Category:** ${result.page.category}

${result.snippet}`;
      }).join('\n\n---\n\n');
      
      return {
        content: [{
          type: 'text' as const,
          text: `# Search Results for "${query}"\n\nFound ${results.length} relevant pages:\n\n${formattedResults}`,
        }],
      };
    }
  );
  
  // Get specific page (Mintlify-style)
  server.tool(
    TOOL_DEFINITIONS.GetOpenCodeDocPage.name,
    TOOL_DEFINITIONS.GetOpenCodeDocPage.description,
    {
      path: z.string().describe('The documentation page path (e.g., "/docs/mcp-servers/", "/docs/config/", "/docs/agents/")'),
    },
    async ({ path }) => {
      const index = getIndex();
      if (!index) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Documentation index not available.',
          }],
        };
      }
      
      // Normalize path
      let normalizedPath = path;
      if (!normalizedPath.startsWith('/docs')) {
        normalizedPath = `/docs/${normalizedPath.replace(/^\//, '')}`;
      }
      
      const page = getPageByPath(index, normalizedPath);
      
      if (!page) {
        const allPages = listAllPages(index);
        const suggestions = allPages
          .filter(p => p.path.includes(path.split('/').pop() || ''))
          .slice(0, 5)
          .map(p => `  - ${p.path}`)
          .join('\n');
        
        return {
          content: [{
            type: 'text' as const,
            text: `Page not found: ${path}\n\nAvailable pages include:\n${suggestions || 'Use BrowseOpenCodeDocs to see all pages.'}`,
          }],
        };
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `# ${page.title}\n\n**URL:** ${page.url}\n**Category:** ${page.category}\n\n---\n\n${page.content}`,
        }],
      };
    }
  );
  
  // Browse all docs (Mintlify-style)
  server.tool(
    TOOL_DEFINITIONS.BrowseOpenCodeDocs.name,
    TOOL_DEFINITIONS.BrowseOpenCodeDocs.description,
    {},
    async () => {
      const index = getIndex();
      if (!index) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Documentation index not available.',
          }],
        };
      }
      
      const categories = listCategories(index);
      const allPages = listAllPages(index);
      
      let overview = `# OpenCode Documentation\n\n`;
      overview += `**Base URL:** ${index.baseUrl}\n`;
      overview += `**Total Pages:** ${index.pages.length}\n`;
      overview += `**Last Updated:** ${new Date(index.updatedAt).toISOString()}\n\n`;
      
      for (const category of categories) {
        const pages = allPages.filter(p => p.category === category);
        overview += `## ${category} (${pages.length} pages)\n\n`;
        for (const page of pages) {
          const fullPage = index.pages.find(p => p.path === page.path);
          overview += `- [${page.title}](${fullPage?.url || page.path})\n`;
        }
        overview += '\n';
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: overview,
        }],
      };
    }
  );
}
