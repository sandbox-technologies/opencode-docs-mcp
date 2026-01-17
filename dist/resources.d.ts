import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DocsIndex } from './types.js';
export declare function registerDocResources(server: McpServer, getIndex: () => DocsIndex | null): void;
