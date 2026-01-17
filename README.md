# OpenCode Docs MCP Server

A Mintlify-style MCP server that enables AI models to search and browse the [OpenCode](https://opencode.ai/docs/) documentation.

## ✨ Features

- **Full-text search** across 33+ documentation pages
- **Category browsing** (Getting Started, Usage, Configure, Develop)
- **Page retrieval** with full markdown content
- **Auto-discovery** of documentation pages from navigation
- **Auto-updating index** that refreshes every 24 hours

---

## 🚀 Quick Start (Choose One)

### Option 1: NPX (Easiest - No Installation)

Just add to your MCP config:

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
> # Example output: /Users/you/.nvm/versions/node/v20.19.5/bin/npx
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

### Option 2: Global Install

```bash
npm install -g opencode-docs-mcp
```

Then add to config:

```json
{
  "mcpServers": {
    "opencode-docs": {
      "command": "opencode-docs-mcp"
    }
  }
}
```

> ⚠️ **Using nvm/fnm/volta?** Use the full path:
> ```bash
> which opencode-docs-mcp
> # Use that path in your config
> ```

### Option 3: Remote Server (Hosted)

If you deploy to Vercel, users can access via HTTP API:

```
https://your-deployment.vercel.app/api/search?q=mcp+servers
```

---

## 📦 MCP Client Configuration

### Cursor

Add to `~/.cursor/mcp.json`:

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

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "opencode-docs": {
      "type": "local",
      "command": ["npx", "-y", "opencode-docs-mcp"]
    }
  }
}
```

### Cline / Continue / Other MCP Clients

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

---

## 🛠 Available Tools

| Tool | Description |
|------|-------------|
| `search_opencode_docs` | Search docs by query, returns relevant pages with snippets |
| `get_opencode_doc_page` | Get full content of a specific documentation page |
| `list_opencode_docs_by_category` | List all pages in a category (Usage, Configure, etc.) |
| `list_opencode_doc_categories` | List all available documentation categories |
| `browse_opencode_docs` | Get full table of contents for the docs |

---

## 📚 Documentation Categories

| Category | Pages | Topics |
|----------|-------|--------|
| **Getting Started** | 7 | Intro, Config, Providers, Network, Enterprise, Troubleshooting, Migration |
| **Usage** | 8 | TUI, CLI, Web, IDE, Zen, Share, GitHub, GitLab |
| **Configure** | 14 | Tools, Rules, Agents, Models, Themes, Keybinds, MCP Servers, etc. |
| **Develop** | 4 | SDK, Server, Plugins, Ecosystem |

---

## 🌐 Deploy Your Own (Vercel)

1. Clone or fork this repo
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`

Users can then access:
- `GET /api/search?q=query` - Search documentation
- `GET /api/page?path=/docs/mcp-servers/` - Get page content
- `GET /api/list` - List all pages

---

## 🔧 Development

```bash
# Clone
git clone https://github.com/your-username/opencode-docs-mcp
cd opencode-docs-mcp

# Install
npm install

# Build
npm run build

# Scrape docs
npm run scrape

# Run locally
npm start
```

---

## 📝 Example Usage

Once connected, AI models can use the tools like:

```
User: "Search the OpenCode docs for how to configure MCP servers"

AI calls: search_opencode_docs({ query: "configure MCP servers" })

Returns: 
- MCP servers (/docs/mcp-servers/) - Relevance: 3.50
  "Add external tools to OpenCode using the Model Context Protocol..."
- Config (/docs/config/) - Relevance: 2.00
- LSP Servers (/docs/lsp/) - Relevance: 1.50
```

---

## 🤝 Contributing

1. Fork the repository
2. Make your changes
3. Submit a PR

---

## 📄 License

MIT

---

## 🔗 Links

- [OpenCode Documentation](https://opencode.ai/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenCode GitHub](https://github.com/anomalyco/opencode)
