import { DocPage, DocsIndex, SearchResult } from './types.js';
export declare function searchDocs(index: DocsIndex, query: string, limit?: number): SearchResult[];
export declare function searchByCategory(index: DocsIndex, category: string): DocPage[];
export declare function getPageByPath(index: DocsIndex, path: string): DocPage | undefined;
export declare function listCategories(index: DocsIndex): string[];
export declare function listAllPages(index: DocsIndex): Array<{
    path: string;
    title: string;
    category: string;
}>;
