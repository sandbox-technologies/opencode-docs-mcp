import { z } from 'zod';
import { searchDocs, searchByCategory, getPageByPath, listCategories, listAllPages } from './search.js';
export function registerDocTools(server, getIndex) {
    // Search docs tool
    server.tool('search_opencode_docs', 'Search the OpenCode documentation for relevant information. Use this to find docs about configuration, usage, MCP servers, agents, and more.', {
        query: z.string().describe('Search query - what you want to find in the docs'),
        limit: z.number().optional().default(5).describe('Maximum number of results to return'),
    }, async ({ query, limit }) => {
        const index = getIndex();
        if (!index) {
            return {
                content: [{
                        type: 'text',
                        text: 'Documentation index not available. Please run the scraper first.',
                    }],
            };
        }
        const results = searchDocs(index, query, limit);
        if (results.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `No results found for "${query}". Try different keywords or browse by category.`,
                    }],
            };
        }
        const formattedResults = results.map((result, i) => {
            const sections = result.matchedSections
                .map(s => `  - ${s.title}`)
                .join('\n');
            return `### ${i + 1}. ${result.page.title}
**URL:** ${result.page.url}
**Category:** ${result.page.category}
**Relevance:** ${result.score.toFixed(2)}

${result.snippet}

${sections ? `**Relevant sections:**\n${sections}` : ''}`;
        }).join('\n\n---\n\n');
        return {
            content: [{
                    type: 'text',
                    text: `# Search Results for "${query}"\n\nFound ${results.length} matching pages:\n\n${formattedResults}`,
                }],
        };
    });
    // Get specific page
    server.tool('get_opencode_doc_page', 'Get the full content of a specific OpenCode documentation page by its path.', {
        path: z.string().describe('The doc page path (e.g., "/docs/config" or "configure/mcp-servers")'),
    }, async ({ path }) => {
        const index = getIndex();
        if (!index) {
            return {
                content: [{
                        type: 'text',
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
                .map(p => `  - ${p.path}: ${p.title}`)
                .join('\n');
            return {
                content: [{
                        type: 'text',
                        text: `Page not found: ${path}\n\nDid you mean:\n${suggestions || 'No suggestions available.'}`,
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: `# ${page.title}\n\n**URL:** ${page.url}\n**Category:** ${page.category}\n\n---\n\n${page.content}`,
                }],
        };
    });
    // List pages by category
    server.tool('list_opencode_docs_by_category', 'List all OpenCode documentation pages in a specific category.', {
        category: z.string().describe('Category name (e.g., "Configure", "Usage", "Develop")'),
    }, async ({ category }) => {
        const index = getIndex();
        if (!index) {
            return {
                content: [{
                        type: 'text',
                        text: 'Documentation index not available.',
                    }],
            };
        }
        const pages = searchByCategory(index, category);
        if (pages.length === 0) {
            const categories = listCategories(index);
            return {
                content: [{
                        type: 'text',
                        text: `No pages found in category "${category}".\n\nAvailable categories:\n${categories.map(c => `  - ${c}`).join('\n')}`,
                    }],
            };
        }
        const pageList = pages
            .map(p => `- [${p.title}](${p.url})`)
            .join('\n');
        return {
            content: [{
                    type: 'text',
                    text: `# ${category} Documentation\n\n${pageList}`,
                }],
        };
    });
    // List all categories
    server.tool('list_opencode_doc_categories', 'List all available categories in the OpenCode documentation.', {}, async () => {
        const index = getIndex();
        if (!index) {
            return {
                content: [{
                        type: 'text',
                        text: 'Documentation index not available.',
                    }],
            };
        }
        const categories = listCategories(index);
        const categoryInfo = categories.map(cat => {
            const pages = searchByCategory(index, cat);
            return `- **${cat}** (${pages.length} pages)`;
        }).join('\n');
        return {
            content: [{
                    type: 'text',
                    text: `# OpenCode Documentation Categories\n\n${categoryInfo}\n\nUse \`list_opencode_docs_by_category\` to see pages in a specific category.`,
                }],
        };
    });
    // Browse all docs
    server.tool('browse_opencode_docs', 'Get an overview of the entire OpenCode documentation structure.', {}, async () => {
        const index = getIndex();
        if (!index) {
            return {
                content: [{
                        type: 'text',
                        text: 'Documentation index not available.',
                    }],
            };
        }
        const categories = listCategories(index);
        let overview = `# OpenCode Documentation\n\n`;
        overview += `**Base URL:** ${index.baseUrl}\n`;
        overview += `**Total Pages:** ${index.pages.length}\n`;
        overview += `**Last Updated:** ${new Date(index.updatedAt).toISOString()}\n\n`;
        for (const category of categories) {
            const pages = searchByCategory(index, category);
            overview += `## ${category}\n\n`;
            for (const page of pages) {
                overview += `- [${page.title}](${page.url})\n`;
            }
            overview += '\n';
        }
        return {
            content: [{
                    type: 'text',
                    text: overview,
                }],
        };
    });
}
