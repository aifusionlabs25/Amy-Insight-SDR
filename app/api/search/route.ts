import { NextResponse } from 'next/server';
import { SearchService } from '@/lib/search/search-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { queryText, mode = 'auto' } = body;

        if (!queryText) {
            return NextResponse.json({ error: 'queryText is required' }, { status: 400 });
        }

        const searchService = new SearchService();
        const response = await searchService.search(queryText, mode);

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[Search API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
