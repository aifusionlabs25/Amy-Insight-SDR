export interface Product {
    id: string;
    title: string;
    manufacturer: string;
    partNumber: string;
    url: string;
    imageUrl?: string;
    shortSpecs?: string;
    description?: string;
}

export interface SearchMatch {
    id: string;
    title: string;
    manufacturer: string;
    partNumber: string;
    url: string;
    imageUrl?: string;
    shortSpecs?: string;
    confidence: number;
}

export interface SearchResponse {
    modeUsed: "auto" | "pn" | "keyword";
    matches: SearchMatch[];
    bestMatchId?: string;
    bestMatchUrl?: string;
    notes?: string;
}

export interface SearchProvider {
    name: string;
    search(query: string, mode: "auto" | "pn" | "keyword"): Promise<SearchMatch[]>;
}
