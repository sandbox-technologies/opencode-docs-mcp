import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
const BASE_URL = 'https://opencode.ai';
const DOCS_BASE = `${BASE_URL}/docs`;
/**
 * Normalize a doc path for deduplication
 */
function normalizePath(path) {
    // Remove trailing slash for comparison, but keep /docs/ as-is
    if (path === '/docs/' || path === '/docs') {
        return '/docs/';
    }
    return path.replace(/\/$/, '');
}
/**
 * Discover all documentation page URLs by parsing the navigation menu
 */
async function discoverDocPages() {
    const pathSet = new Map(); // normalized -> original
    pathSet.set('/docs/', '/docs/');
    try {
        console.log('Discovering documentation pages from navigation...');
        const html = await fetchPage(DOCS_BASE);
        const $ = cheerio.load(html);
        // Find all navigation links
        $('nav a[href], aside a[href], [role="navigation"] a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/docs')) {
                const cleanPath = href.split('#')[0].split('?')[0];
                const normalized = normalizePath(cleanPath);
                if (normalized && !pathSet.has(normalized)) {
                    pathSet.set(normalized, cleanPath);
                }
            }
        });
        // Also look for links in the main content area
        $('main a[href], article a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/docs')) {
                const cleanPath = href.split('#')[0].split('?')[0];
                const normalized = normalizePath(cleanPath);
                if (normalized && !pathSet.has(normalized)) {
                    pathSet.set(normalized, cleanPath);
                }
            }
        });
        console.log(`Discovered ${pathSet.size} unique documentation pages`);
    }
    catch (error) {
        console.error('Failed to discover pages, using fallback list:', error);
        // Fallback to known working pages
        ['/docs/config', '/docs/providers', '/docs/network', '/docs/enterprise', '/docs/troubleshooting']
            .forEach(p => pathSet.set(normalizePath(p), p));
    }
    return Array.from(pathSet.values());
}
async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.text();
}
function extractHeadings($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const $el = $(el);
        const level = parseInt(el.tagName.slice(1), 10);
        const text = $el.text().trim();
        const id = $el.attr('id') || text.toLowerCase().replace(/\s+/g, '-');
        if (text) {
            headings.push({ level, text, id });
        }
    });
    return headings;
}
function htmlToMarkdown($, selector) {
    const content = $(selector);
    // Remove script and style elements
    content.find('script, style, nav').remove();
    let markdown = '';
    content.find('*').each((_, el) => {
        const $el = $(el);
        const tag = el.tagName.toLowerCase();
        switch (tag) {
            case 'h1':
                markdown += `\n# ${$el.text().trim()}\n\n`;
                break;
            case 'h2':
                markdown += `\n## ${$el.text().trim()}\n\n`;
                break;
            case 'h3':
                markdown += `\n### ${$el.text().trim()}\n\n`;
                break;
            case 'h4':
                markdown += `\n#### ${$el.text().trim()}\n\n`;
                break;
            case 'p':
                markdown += `${$el.text().trim()}\n\n`;
                break;
            case 'pre':
            case 'code':
                if (tag === 'pre') {
                    const code = $el.find('code').text() || $el.text();
                    const lang = $el.find('code').attr('class')?.match(/language-(\w+)/)?.[1] || '';
                    markdown += `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
                }
                break;
            case 'li':
                markdown += `- ${$el.text().trim()}\n`;
                break;
            case 'a':
                const href = $el.attr('href');
                const text = $el.text().trim();
                if (href && text && !markdown.includes(text)) {
                    markdown += `[${text}](${href}) `;
                }
                break;
        }
    });
    // Clean up excessive newlines
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
}
// Page categorization based on OpenCode documentation structure
const CATEGORY_MAP = {
    // Getting Started
    '': 'Getting Started',
    'config': 'Getting Started',
    'providers': 'Getting Started',
    'network': 'Getting Started',
    'enterprise': 'Getting Started',
    'troubleshooting': 'Getting Started',
    '1-0': 'Getting Started',
    // Usage
    'tui': 'Usage',
    'cli': 'Usage',
    'web': 'Usage',
    'ide': 'Usage',
    'zen': 'Usage',
    'share': 'Usage',
    'github': 'Usage',
    'gitlab': 'Usage',
    // Configure
    'tools': 'Configure',
    'rules': 'Configure',
    'agents': 'Configure',
    'models': 'Configure',
    'themes': 'Configure',
    'keybinds': 'Configure',
    'commands': 'Configure',
    'formatters': 'Configure',
    'permissions': 'Configure',
    'lsp': 'Configure',
    'mcp-servers': 'Configure',
    'acp': 'Configure',
    'skills': 'Configure',
    'custom-tools': 'Configure',
    // Develop
    'sdk': 'Develop',
    'server': 'Develop',
    'plugins': 'Develop',
    'ecosystem': 'Develop',
};
function getCategoryFromPath(pagePath) {
    const parts = pagePath.split('/').filter(Boolean);
    // Root docs page
    if (parts.length <= 1 || (parts.length === 2 && parts[1] === '')) {
        return 'Getting Started';
    }
    const slug = parts[1].replace(/\/$/, '');
    return CATEGORY_MAP[slug] || 'General';
}
async function scrapePage(pagePath) {
    const url = `${BASE_URL}${pagePath}`;
    try {
        console.log(`Scraping: ${url}`);
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        // Try different selectors for main content
        const contentSelectors = [
            'main',
            'article',
            '.content',
            '.docs-content',
            '[role="main"]',
            '.markdown-body',
        ];
        let content = '';
        for (const selector of contentSelectors) {
            if ($(selector).length) {
                content = htmlToMarkdown($, selector);
                if (content.length > 100)
                    break;
            }
        }
        // Fallback to body if no content found
        if (!content || content.length < 100) {
            content = htmlToMarkdown($, 'body');
        }
        const title = $('h1').first().text().trim() ||
            $('title').text().replace(' | OpenCode', '').trim() ||
            pagePath.split('/').pop() || 'Untitled';
        const headings = extractHeadings($);
        return {
            path: pagePath,
            title,
            url,
            content,
            headings,
            category: getCategoryFromPath(pagePath),
            scrapedAt: Date.now(),
        };
    }
    catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    }
}
export async function scrapeAllDocs() {
    const pages = [];
    // Discover pages dynamically from navigation
    const docPaths = await discoverDocPages();
    for (const pagePath of docPaths) {
        const page = await scrapePage(pagePath);
        if (page) {
            pages.push(page);
        }
        // Be respectful with rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    return {
        pages,
        version: '1.0.0',
        updatedAt: Date.now(),
        baseUrl: DOCS_BASE,
    };
}
export async function saveIndex(index, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
    console.log(`Saved index to ${outputPath}`);
}
export function loadIndex(indexPath) {
    try {
        if (fs.existsSync(indexPath)) {
            const data = fs.readFileSync(indexPath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error('Failed to load index:', error);
    }
    return null;
}
// Run scraper if called directly
if (process.argv[1]?.endsWith('scraper.js')) {
    const outputPath = process.argv[2] || './data/docs-index.json';
    console.log('Starting OpenCode docs scraper...');
    scrapeAllDocs()
        .then(index => saveIndex(index, outputPath))
        .then(() => console.log('Scraping complete!'))
        .catch(console.error);
}
