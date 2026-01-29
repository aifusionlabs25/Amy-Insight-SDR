
import OpenAI from 'openai';
import { CONFIG } from './config';

// Interface adapted for SDR / IT Solutions - Insight Public Sector
export interface LeadData {
    lead_name: string;
    lead_email: string;
    lead_phone: string;

    // Inquiry Details
    inquiry_type: string; // e.g., "Cloud Migration", "Cybersecurity", "Hardware Refresh"
    pain_points: string[];
    current_infrastructure: string;

    // Hardware/Product specifics (NEW)
    product_details: string; // Specific units, models, or quantities mentioned (e.g. "15x Lenovo ThinkPad X1 Carbon Gen 12")

    // Conversation Summary (NEW)
    summary: string; // A detailed 2-3 paragraph summary of the entire technical discussion

    // Qualification (The "Gold")
    budget: string;
    timeline: string;
    competitors_or_blockers: string[];
    qualification_status: string;

    // Action Planning
    amy_action: string;
    recommended_next_steps: string[];

    followUpEmail: string;
}

export class OpenAIService {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ OPENAI_API_KEY missing. Analysis will fail.');
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
        });

        console.log(`[OpenAIService] Initializing with model: ${CONFIG.OPENAI.MODEL}`);
    }

    async analyzeTranscript(transcript: string): Promise<LeadData | null> {
        if (!transcript) return null;

        const systemPrompt = `
        You are 'Amy', a Senior SDR for Insight Public Sector (Insight Enterprises). 
        Your job is to perform a deep analysis of an IT technical sales conversation.
        
        Analyze the transcript below and extract comprehensive information into a JSON object.

        CRITICAL: The user wants extreme detail. Do NOT be minimal.
        
        GUIDELINES:
        - **SUMMARY**: Provide a detailed 2-3 paragraph breakdown of the conversation. Include specific technical requirements, the user's emotional state (if relevant), and any long-term goals mentioned.
        - **PRODUCT_DETAILS**: List EVERY specific piece of hardware, software, part number, or model mentioned. Include quantities if discussed (e.g., "50x Cisco C9200L switches").
        - **inquiry_type**: Classify accurately (Cloud, Cybersecurity, Hardware, AI, etc.).
        - **pain_points**: Extract specific, detailed business or technical challenges.
        - **current_infrastructure**: Detail exactly what they are replacing or integrating with.
        - **followUpEmail**: Write a THOROUGH, professional follow-up email (HTML).
            - Include a "Discussion Summary" section.
            - List the specific products/units discussed.
            - Clearly state the next steps.
            - Use a warm, consultative tone.
            - Sign off as "Amy".

        EXAMPLE OUTPUT FORMAT:
        {
            "lead_name": "Dave Miller",
            "lead_email": "dave@citygov.org",
            "lead_phone": "555-0199",
            "inquiry_type": "Hardware Refresh / Networking",
            "pain_points": ["Current core switches are end-of-life", "Need more PoE capacity for new APs"],
            "current_infrastructure": "Legacy Cisco 2960s with 100MB uplinks",
            "product_details": "48x Cisco Catalyst 9200L (C9200L-48P-4G), 5x Core 9500 switches",
            "summary": "Dave is looking to overhaul the city's switching fabric. He expressed frustration with the current 2960 performance and is prioritized for a Q3 rollout. We discussed the benefits of moving to the 9000 series for DNA licensing and automation.",
            "budget": "State Grant already approved for $150k",
            "timeline": "Deployment target: September 2026",
            "competitors_or_blockers": ["Waiting on final quote from CDW to compare"],
            "qualification_status": "Qualified - Hot",
            "amy_action": "Opened Search Assist for Cisco 9200 and explained lead times.",
            "recommended_next_steps": [
                "Schedule deep-dive with Networking Specialist",
                "Draft preliminary Bill of Materials (BOM)"
            ],
            "followUpEmail": "<p>Hi Dave,</p><p>It was a pleasure mapping out your network refresh today. I've noted the priority on the Catalyst 9200L series to support your new access point rollout.</p><h3>Conversation Summary</h3><p>We covered your transition from the legacy 2960 environment to a modern Cisco DNA architecture. I understand the criticality of hitting that September deadline to align with your grant funding.</p><h3>Discussed Solutions</h3><ul><li>Cisco Catalyst 9200L (48-port PoE+)</li><li>Cisco Catalyst 9500 (Core)</li></ul><p>Our Networking Specialist will reach out shortly to finalize the specs.</p><p>Best regards,<br>Amy</p>"
        }
        `;

        try {
            console.log('⚡ OpenAI Analysis Started...');

            const completion = await this.openai.chat.completions.create({
                model: CONFIG.OPENAI.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Transcript:\n"${transcript}"` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("Empty response from OpenAI");

            console.log('[OpenAIService] 🔍 RAW JSON OUTPUT:', content.substring(0, 100) + '...');

            const data = JSON.parse(content) as LeadData;
            return data;

        } catch (error: any) {
            console.error('❌ OpenAI Analysis Failed:', error.message);

            // FALLBACK
            return {
                lead_name: "Valued Client",
                lead_email: "aifusionlabs@gmail.com",
                lead_phone: "Unknown",
                inquiry_type: "General Inquiry",
                pain_points: ["Unknown"],
                current_infrastructure: "Unknown",
                product_details: "N/A",
                summary: "Transcription processing initiated.",
                budget: "Unknown",
                timeline: "Unknown",
                competitors_or_blockers: [],
                qualification_status: "Needs review",
                amy_action: "Attempted intake",
                recommended_next_steps: ["Manual Follow-up Required"],
                followUpEmail: "<p>Hello,</p><p>Thank you for speaking with Insight Public Sector. We have received your query and a specialist will reach out to you shortly.</p><p>Best regards,<br>Amy</p>"
            };
        }
    }
}
