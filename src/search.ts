import { DocPage, DocSection, DocsIndex, SearchResult } from './types.js';

/**
 * Simple TF-IDF-like scoring for text search
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function calculateScore(query: string, content: string, title: string): number {
  const queryTokens = tokenize(query);
  const contentTokens = new Set(tokenize(content));
  const titleTokens = new Set(tokenize(title));
  
  if (queryTokens.length === 0) return 0;
  
  let score = 0;
  let titleMatches = 0;
  let contentMatches = 0;
  
  for (const token of queryTokens) {
    // Title matches are weighted higher
    if (titleTokens.has(token)) {
      titleMatches++;
      score += 3;
    }
    if (contentTokens.has(token)) {
      contentMatches++;
      score += 1;
    }
    
    // Partial matches for longer tokens
    if (token.length > 4) {
      for (const t of titleTokens) {
        if (t.includes(token) || token.includes(t)) {
          score += 1.5;
        }
      }
      for (const c of contentTokens) {
        if (c.includes(token) || token.includes(c)) {
          score += 0.5;
        }
      }
    }
  }
  
  // Normalize by query length
  const normalizedScore = score / queryTokens.length;
  
  // Boost exact phrase matches
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerContent.includes(lowerQuery)) {
    return normalizedScore + 5;
  }
  
  return normalizedScore;
}

function extractSnippet(content: string, query: string, contextLength: number = 200): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryTokens = tokenize(query);
  
  // Try to find exact match first
  let matchIndex = lowerContent.indexOf(lowerQuery);
  
  // If no exact match, find first matching token
  if (matchIndex === -1) {
    for (const token of queryTokens) {
      matchIndex = lowerContent.indexOf(token);
      if (matchIndex !== -1) break;
    }
  }
  
  if (matchIndex === -1) {
    // Return start of content if no match found
    return content.slice(0, contextLength * 2) + '...';
  }
  
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + contextLength);
  
  let snippet = content.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return snippet;
}

function extractSections(page: DocPage): DocSection[] {
  const sections: DocSection[] = [];
  const lines = page.content.split('\n');
  
  let currentSection: DocSection | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }
      
      // Start new section
      const title = headingMatch[2];
      currentSection = {
        title,
        anchor: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        content: '',
        pagePath: page.path,
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

export function searchDocs(index: DocsIndex, query: string, limit: number = 10): SearchResult[] {
  const results: SearchResult[] = [];
  
  for (const page of index.pages) {
    const score = calculateScore(query, page.content, page.title);
    
    if (score > 0) {
      const allSections = extractSections(page);
      const matchedSections = allSections.filter(section => 
        calculateScore(query, section.content, section.title) > 0
      );
      
      results.push({
        score,
        page,
        matchedSections: matchedSections.slice(0, 3),
        snippet: extractSnippet(page.content, query),
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, limit);
}

export function searchByCategory(index: DocsIndex, category: string): DocPage[] {
  return index.pages.filter(page => 
    page.category.toLowerCase() === category.toLowerCase()
  );
}

export function getPageByPath(index: DocsIndex, path: string): DocPage | undefined {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return index.pages.find(page => 
    page.path === normalizedPath || 
    page.path === normalizedPath + '/' ||
    page.path.replace(/\/$/, '') === normalizedPath.replace(/\/$/, '')
  );
}

export function listCategories(index: DocsIndex): string[] {
  const categories = new Set(index.pages.map(page => page.category));
  return Array.from(categories).sort();
}

export function listAllPages(index: DocsIndex): Array<{ path: string; title: string; category: string }> {
  return index.pages.map(page => ({
    path: page.path,
    title: page.title,
    category: page.category,
  }));
}
