export interface DocPage {
  /** URL path (e.g., /docs/config) */
  path: string;
  /** Page title */
  title: string;
  /** Full URL */
  url: string;
  /** Page content as markdown */
  content: string;
  /** Section headings on this page */
  headings: DocHeading[];
  /** Parent category */
  category: string;
  /** Last scraped timestamp */
  scrapedAt: number;
}

export interface DocHeading {
  /** Heading level (1-6) */
  level: number;
  /** Heading text */
  text: string;
  /** Anchor ID */
  id: string;
}

export interface DocSection {
  /** Section title */
  title: string;
  /** Anchor link */
  anchor: string;
  /** Section content */
  content: string;
  /** Parent page path */
  pagePath: string;
}

export interface SearchResult {
  /** Relevance score (0-1) */
  score: number;
  /** Matched page */
  page: DocPage;
  /** Matching sections */
  matchedSections: DocSection[];
  /** Snippet with context */
  snippet: string;
}

export interface DocsIndex {
  /** All indexed pages */
  pages: DocPage[];
  /** Search index version */
  version: string;
  /** Last updated timestamp */
  updatedAt: number;
  /** Base URL for the docs */
  baseUrl: string;
}
