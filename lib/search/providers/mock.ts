import { SearchProvider, SearchMatch } from '../types';
import { MOCK_CATALOG } from '../catalog';

export class MockSearchProvider implements SearchProvider {
    name = "mock";

    async search(query: string, mode: "auto" | "pn" | "keyword"): Promise<SearchMatch[]> {
        const normalizedQuery = query.toLowerCase().trim();

        // 1. Exact PN Match (High Priority)
        const pnMatches = MOCK_CATALOG
            .filter(p => p.partNumber.toLowerCase() === normalizedQuery)
            .map(p => ({ ...p, confidence: 1.0 }));

        if (pnMatches.length > 0) return pnMatches;

        // 2. Fuzzy Keyword Match
        if (mode === 'pn' && pnMatches.length === 0) return [];

        const keywords = normalizedQuery.split(/\s+/);
        const matches: SearchMatch[] = MOCK_CATALOG.map(product => {
            let score = 0;
            const fullText = `${product.title} ${product.manufacturer} ${product.partNumber} ${product.shortSpecs} ${product.description}`.toLowerCase();

            // Exact full phrase match
            if (fullText.includes(normalizedQuery)) {
                score += 0.5;
            }

            // Keyword count match
            keywords.forEach(word => {
                if (fullText.includes(word)) {
                    score += 0.1;
                }
            });

            // PN partial match
            if (product.partNumber.toLowerCase().includes(normalizedQuery)) {
                score += 0.3;
            }

            return {
                ...product,
                confidence: Math.min(score, 0.95)
            };
        });

        return matches
            .filter(m => m.confidence > 0.1)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
    }
}
