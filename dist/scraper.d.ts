import { DocsIndex } from './types.js';
export declare function scrapeAllDocs(): Promise<DocsIndex>;
export declare function saveIndex(index: DocsIndex, outputPath: string): Promise<void>;
export declare function loadIndex(indexPath: string): DocsIndex | null;
