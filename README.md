<img width="15712" height="3776" alt="logo-tshirt (5)" src="https://github.com/user-attachments/assets/bb199bd6-3958-4300-bb5f-3e01ca64867a" />

# OpenCode Docs MCP Server

[![npm version](https://badge.fury.io/js/opencode-docs-mcp.svg)](https://www.npmjs.com/package/opencode-docs-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Mintlify-style MCP server that enables AI models to search and browse the [OpenCode](https://opencode.ai/docs/) documentation.

## ✨ Features

- **Full-text search** across 33+ documentation pages
- **Category browsing** (Getting Started, Usage, Configure, Develop)
- **Page retrieval** with full markdown content
- **Auto-discovery** of documentation pages from navigation
- **Auto-updating index** that refreshes every 24 hours
- **Mintlify-style** tool descriptions and responses

---

## 🚀 Quick Start

### Option 1: Remote Server (Recommended - No Installation)

Just add a URL to your MCP config:

```json
{
  "mcpServers": {
    "opencode-docs": {
      "name": "opencode-docs",
      "url": "https://tryinspector.com/api/opencode-docs/mcp",
      "headers": {}
    }
  }
}
```

### Option 2: NPX (Local)

```json
{
  "mcpServers": {
    "opencode-docs": {
      "command": "npx",
      "args": ["-y", "opencode-docs-mcp"]
    }
  }
}
```

> ⚠️ **Using nvm, fnm, or volta?** You need the full path to npx:
> ```bash
> # Find your npx path
> which npx
> # Example: /Users/you/.nvm/versions/node/v20.19.5/bin/npx
> ```
> Then use the full path in your config:
> ```json
> {
>   "mcpServers": {
>     "opencode-docs": {
>       "command": "/Users/you/.nvm/versions/node/v20.19.5/bin/npx",
>       "args": ["-y", "opencode-docs-mcp"]
>     }
>   }
> }
> ```

### Option 3: Global Install

```bash
npm install -g opencode-docs-mcp
```

```json
{
  "mcpServers": {
    "opencode-docs": {
      "command": "opencode-docs-mcp"
    }
  }
}
```

---

## 📦 MCP Client Configuration

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "opencode-docs": {
      "name": "opencode-docs",
      "url": "https://tryinspector.com/api/opencode-docs/mcp",
      "headers": {}
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencode-docs": {
      "url": "https://tryinspector.com/api/opencode-docs/mcp"
    }
  }
}
```

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "opencode-docs": {
      "type": "remote",
      "url": "https://tryinspector.com/api/opencode-docs/mcp"
    }
  }
}
```

---

## 🛠 Available Tools

| Tool | Description |
|------|-------------|
| `SearchOpenCodeDocs` | Search docs by query, returns relevant pages with contextual snippets and links |
| `GetOpenCodeDocPage` | Get full content of a specific documentation page by path |
| `BrowseOpenCodeDocs` | Get complete table of contents with all categories and pages |

---

## 📚 Documentation Categories

| Category | Pages | Topics |
|----------|-------|--------|
| **Getting Started** | 7 | Intro, Config, Providers, Network, Enterprise, Troubleshooting, Migration |
| **Usage** | 8 | TUI, CLI, Web, IDE, Zen, Share, GitHub, GitLab |
| **Configure** | 14 | Tools, Rules, Agents, Models, Themes, Keybinds, MCP Servers, etc. |
| **Develop** | 4 | SDK, Server, Plugins, Ecosystem |

---

## 📝 Example Usage

Once connected, AI models can use the tools like:

```
User: "How do I configure MCP servers in OpenCode?"

AI calls: SearchOpenCodeDocs({ query: "configure MCP servers" })

Returns:
### 1. [MCP servers](https://opencode.ai/docs/mcp-servers/)
**Category:** Configure

Add external tools to OpenCode using the Model Context Protocol...
```

---

## 🌐 Self-Hosting

### Deploy to Vercel

The remote server endpoint can be added to any Next.js project. See the source for the API route implementation.

### Run Locally

```bash
git clone https://github.com/anthropics/opencode-docs-mcp
cd opencode-docs-mcp
npm install
npm run build
npm run scrape  # Pre-populate the docs index
npm start
```

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Re-scrape docs
npm run scrape

# Run locally
npm start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- [OpenCode Documentation](https://opencode.ai/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenCode GitHub](https://github.com/anomalyco/opencode)
- [npm Package](https://www.npmjs.com/package/opencode-docs-mcp)
