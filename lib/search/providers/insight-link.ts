import { SearchProvider, SearchMatch } from '../types';

export class InsightLinkSearchProvider implements SearchProvider {
    name = "insight_link";

    async search(query: string, mode: "auto" | "pn" | "keyword"): Promise<SearchMatch[]> {
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://www.insight.com/en_US/search.html?q=${encodedQuery}`;

        return [{
            id: `insight-search-${Date.now()}`,
            title: `Search Insight.com for "${query}"`,
            manufacturer: "Insight Enterprises",
            partNumber: query,
            url: searchUrl,
            confidence: 0.5,
            shortSpecs: "View full results on the official Insight catalog."
        }];
    }
}
