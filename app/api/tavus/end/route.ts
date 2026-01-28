import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { conversation_id } = await request.json();

    if (!conversation_id) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://tavusapi.com/v2/conversations/${conversation_id}/end`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.TAVUS_API_KEY || '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to end conversation:', await response.text());
            return NextResponse.json({ error: 'Failed to end conversation' }, { status: response.status });
        }

        console.log(`Successfully ended conversation: ${conversation_id}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error ending conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
