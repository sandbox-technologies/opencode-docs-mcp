import { listCategories, searchByCategory } from './search.js';
export function registerDocResources(server, getIndex) {
    // Resource template for doc pages
    server.resource('opencode-docs-index', 'opencode://docs/index', async (uri) => {
        const index = getIndex();
        if (!index) {
            return {
                contents: [{
                        uri: uri.href,
                        mimeType: 'text/plain',
                        text: 'Documentation index not available. Please run the scraper first.',
                    }],
            };
        }
        const categories = listCategories(index);
        let toc = '# OpenCode Documentation Index\n\n';
        for (const category of categories) {
            const pages = searchByCategory(index, category);
            toc += `## ${category}\n\n`;
            for (const page of pages) {
                toc += `- [${page.title}](${page.url}) - \`${page.path}\`\n`;
            }
            toc += '\n';
        }
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: 'text/markdown',
                    text: toc,
                }],
        };
    });
    // Resource for quick reference
    server.resource('opencode-quick-reference', 'opencode://docs/quick-reference', async (uri) => {
        const index = getIndex();
        if (!index) {
            return {
                contents: [{
                        uri: uri.href,
                        mimeType: 'text/plain',
                        text: 'Documentation index not available.',
                    }],
            };
        }
        const quickRef = `# OpenCode Quick Reference

## Installation

\`\`\`bash
curl -fsSL https://opencode.ai/install | bash
# or
npm install -g opencode-ai
# or
brew install anomalyco/tap/opencode
\`\`\`

## Getting Started

1. Run \`opencode\` in your project directory
2. Run \`/init\` to initialize OpenCode for the project
3. Run \`/connect\` to set up your LLM provider

## Key Commands

| Command | Description |
|---------|-------------|
| \`/init\` | Initialize OpenCode for a project |
| \`/connect\` | Connect to an LLM provider |
| \`/undo\` | Undo the last change |
| \`/redo\` | Redo the last undone change |
| \`/share\` | Share your conversation |
| \`Tab\` | Toggle between Plan and Build mode |
| \`@\` | Fuzzy search for files |

## Configuration Files

- \`AGENTS.md\` - Project-specific agent instructions
- \`opencode.json\` - OpenCode configuration
- \`.opencode/\` - Local OpenCode data

## Documentation Links

- [Intro](https://opencode.ai/docs/)
- [Config](https://opencode.ai/docs/config)
- [MCP Servers](https://opencode.ai/docs/configure/mcp-servers)
- [Custom Tools](https://opencode.ai/docs/configure/custom-tools)
- [Agent Skills](https://opencode.ai/docs/configure/agent-skills)
`;
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: 'text/markdown',
                    text: quickRef,
                }],
        };
    });
}
