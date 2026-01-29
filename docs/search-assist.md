# Search Assist Module

The Search Assist module is a premium demo feature for Insight Amy that allows users to look up Part Numbers (PN/SKU) and product keywords directly on the demo page.

## Features
- **Auto-Detection**: Distinguishes between Part Numbers (e.g., `C9500-48Y4C-A`) and keyword queries (e.g., `Cisco Switch`).
- **Real-time Tool Calling**: Amy can autonomously trigger the search panel via Tavus V2 tool calls.
- **Iframe Fallback**: Smart detection of blocked iframes with an integrated product card and "Open in New Tab" action.
- **Pluggable Providers**: Modular backend architecture.

## How it Works
1. **Frontend**: `SearchAssist.tsx` listens for Daily `app-message` signals.
2. **Backend**: `/api/search` route handles the request and routes it to the `SearchService`.
3. **Providers**:
   - `MockSearchProvider`: Searches against `/lib/search/catalog.ts`.
   - `InsightLinkSearchProvider`: Fallback that generates direct Insight search links.

## Configuration
The search behaviour can be toggled via the "Search Assist" button in the demo header.

### Adding New Products
To add more items to the mock catalog, edit:
`[repo]/lib/search/catalog.ts`

Follow the `Product` interface:
```typescript
{
    id: "string",
    title: "string",
    manufacturer: "string",
    partNumber: "string",
    url: "string",
    imageUrl: "string (optional)",
    shortSpecs: "string (optional)"
}
```

### Swapping Providers
To integrate an official API or partner feed:
1. Create a new provider in `lib/search/providers/`.
2. Implement the `SearchProvider` interface.
3. Register the provider in `lib/search/search-service.ts`.
