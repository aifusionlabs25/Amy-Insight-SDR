import { SearchProvider, SearchResponse, SearchMatch } from './types';
import { MockSearchProvider } from './providers/mock';
import { InsightLinkSearchProvider } from './providers/insight-link';

export class SearchService {
    private providers: SearchProvider[] = [];

    constructor() {
        // Initialize with default providers
        this.providers.push(new MockSearchProvider());
        this.providers.push(new InsightLinkSearchProvider());
    }

    async search(query: string, mode: "auto" | "pn" | "keyword" = "auto"): Promise<SearchResponse> {
        let detectedMode = mode;
        const trimmedQuery = query.trim();

        if (mode === "auto") {
            // Heuristic for Part Number: alphanumeric, typically uppercase, often contains hyphens
            // Example: C9200L-24T-4G-E, FG-60F-BDL, 822P1UT#ABA
            const isPN = /^[A-Z0-9#-]{5,25}$/i.test(trimmedQuery);
            detectedMode = isPN ? "pn" : "keyword";
        }

        console.log(`[SearchService] Query: "${trimmedQuery}" | Mode: ${detectedMode}`);

        let allMatches: SearchMatch[] = [];

        // Use providers based on config/mode
        // For demo, we run the Mock provider first
        for (const provider of this.providers) {
            try {
                const results = await provider.search(query, detectedMode);
                allMatches = [...allMatches, ...results];

                // If we found a high confidence PN match in the mock, we can stop early
                if (detectedMode === "pn" && results.some(r => r.confidence >= 0.9)) {
                    break;
                }
            } catch (err) {
                console.error(`[SearchService] Provider ${provider.name} failed:`, err);
            }
        }

        // De-duplicate by URL and sort
        const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.url, m])).values())
            .sort((a, b) => b.confidence - a.confidence);

        const bestMatch = uniqueMatches[0];

        return {
            modeUsed: detectedMode,
            matches: uniqueMatches,
            bestMatchId: bestMatch?.id,
            bestMatchUrl: bestMatch?.url,
            notes: uniqueMatches.length === 0 ? "No results found." : undefined
        };
    }
}
