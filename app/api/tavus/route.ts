import { NextResponse } from 'next/server';
import { AMY_SYSTEM_PROMPT } from '@/lib/amy-prompt';


// Helper to clean greeting for TTS
function cleanGreetingForTTS(greeting: string): string {
    // 1. Collapse whitespace (newlines/spaces) -> single space
    greeting = greeting.replace(/\s+/g, ' ');

    // 2. Strip ellipsis (spoken as "dot dot dot")
    greeting = greeting.replace(/\.\.\./g, ',');

    // 3. Fix brand name
    greeting = greeting.replace(/Insight Enterprises/g, 'Insight Enterprises'); // No specific pronunciation fix needed likely

    // 4. Remove em-dashes
    greeting = greeting.replace(/—/g, ',');

    // 5. Trim final result
    return greeting.trim();
}

// Default KB Tags
const DEFAULT_KB_TAGS = [
    'insight-overview',
    'it-solutions',
    'cloud-migration',
    'cybersecurity-services',
    'modern-workplace'
];

export async function POST(request: Request) {
    // Destructure body
    const { persona_id: _ignored, audio_only, memory_id, document_tags, custom_greeting, context_url, conversation_name, conversational_context, properties } = await request.json();

    // 1. Get Persona ID secure from server
    const serverPersonaId = process.env.TAVUS_PERSONA_ID;
    if (!serverPersonaId) {
        console.error('SERVER ERROR: TAVUS_PERSONA_ID not set in env');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // DEBUG LOGGING
    console.log('[Setup] Starting Tavus session...');
    console.log('[Setup] Persona ID defined:', !!serverPersonaId);
    console.log('[Setup] API Key defined:', !!process.env.TAVUS_API_KEY);
    console.log('[Setup] Cartesia Key defined:', !!process.env.CARTESIA_API_KEY);

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
        let finalBaseUrl = baseUrl;

        if (process.env.VERCEL_ENV === 'production') {
            finalBaseUrl = 'https://insight-amy.vercel.app'; // Placeholder domain
        } else if (process.env.VERCEL_URL) {
            finalBaseUrl = `https://${process.env.VERCEL_URL}`;
        }

        // DYNAMIC Webhook Resolution
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const currentDomain = `${protocol}://${host}`;
        const callbackUrl = `${currentDomain}/api/webhook`;

        console.log('[Setup] 🔗 Calculated Dynamic Hub:', currentDomain);
        console.log('[Setup] 🔗 Webhook Callback URL:', callbackUrl);
        console.log('[Setup] 🧩 Incoming Properties:', JSON.stringify(properties));
        console.log('[Setup] 👤 User Identity:', properties?.user_email ? `${properties.user_name} <${properties.user_email}>` : 'Anonymous');



        // Clean the greeting
        const rawGreeting = custom_greeting || "Hi, I'm Amy with Insight. Thanks for reaching out. I'm here to help connect you with the right specialists. What is top of mind for you today?";
        const cleanedGreeting = cleanGreetingForTTS(rawGreeting);

        // Merge default tags with any custom tags
        const finalTags = Array.from(new Set([...DEFAULT_KB_TAGS, ...(document_tags || [])]));

        const body: any = {
            persona_id: serverPersonaId,
            custom_greeting: cleanedGreeting,
            conversation_name: conversation_name || "Insight Discovery Session",
            conversational_context: AMY_SYSTEM_PROMPT,
            document_tags: finalTags,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "search_assist",
                        description: "Search hardware inventory for specific products, models, or part numbers. Call this when you want to look up hardware inventory or specifications.",
                        parameters: {
                            type: "object",
                            required: ["query"],
                            properties: {
                                query: {
                                    type: "string",
                                    description: "Product name or part number (e.g. 'Lenovo ThinkPad', 'Cisco Switch', 'FG-60F')"
                                }
                            }
                        }
                    }
                }
            ],
            properties: {
                max_call_duration: 1800, // 30 Minutes
                enable_recording: true,
                participant_absent_timeout: 60,
                participant_left_timeout: 60,
                tool_choice: "auto", // Ensure tools are active
                ...(properties || {})
            },
            audio_only: audio_only,
            memory_id: memory_id,
            callback_url: callbackUrl,
        };

        console.log('[Tavus API] 📦 Final Request Body:', JSON.stringify(body, null, 2));

        // TTS Configuration is now handled via the Tavus Dashboard or persona settings.
        // We do NOT send 'layers' or 'tts' overrides here to avoid "Unknown field" errors.


        const response = await fetch("https://tavusapi.com/v2/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.TAVUS_API_KEY || "",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Tavus API] Request Failed:', JSON.stringify(errorData, null, 2));
            return NextResponse.json({ error: errorData.message || 'Failed to start conversation' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Tavus API] Conversation created:', data.conversation_id);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Tavus API] CRITICAL ERROR:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error', details: error.toString() }, { status: 500 });
    }
}
