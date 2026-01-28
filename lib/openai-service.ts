
import OpenAI from 'openai';
import { CONFIG } from './config';

// Interface adapted for SDR / IT Solutions - Insight Public Sector
export interface LeadData {
    lead_name: string;
    lead_email: string;
    lead_phone: string;

    // Inquiry Details
    inquiry_type: string; // e.g., "Cloud Migration", "Cybersecurity", "Hardware Refresh"
    pain_points: string[]; // e.g., "Current server obsolete", "Ransomware fears"
    current_infrastructure: string; // e.g., "On-prem Exchange", "AWS Legacy"

    // Qualification (The "Gold")
    budget: string;
    timeline: string;
    competitors_or_blockers: string[]; // e.g., "Considering CDW", "Budget freeze until Q3"
    qualification_status: string; // "Hot Lead", "Nurture", "Disqualified"

    // Action Planning
    amy_action: string; // What Agent did
    recommended_next_steps: string[]; // e.g., "Schedule Assessment", "Send Whitepaper"

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
        You are 'Amy', a Senior SDR for Insight Public Sector (Insight Enterprises). Your job is to extract IT/Tech needs and qualify public sector/enterprise leads from a conversation.

        Analyze the transcript below and extract the key information into a JSON object.

        GUIDELINES:
        - **Be precise and fact-based.** Do not infer details not present.
        - **inquiry_type**: Classify as "Cloud", "Cybersecurity", "Hardware/Devices", "AI/Data", or "Modern Workforce".
        - **pain_points**: List specific technical or business challenges.
        - **current_infrastructure**: What are they using now? (Legacy systems, specific vendors).
        - **qualification_status**: "Qualified" (Decision maker + Budget/Need), "Nurture" (Research phase), or "Disqualified".
        - **recommended_next_steps**: Concrete steps for the Account Executive (e.g. "Schedule Tech Check", "Send Quote").
        
        - **followUpEmail**: Write a professional, concise, outcome-oriented follow-up email body (HTML text, <p>, <br>, <ul> only). 
          - Address client by name.
          - Context: "Great chatting about your [Topic] needs."
          - Value Add: Mention one specific insight or solution relevant to them.
          - Call to Action: "I'll have our [Topic] Specialist send over some specs."
          - Sign off as "Amy".

        EXAMPLE OUTPUT FORMAT:
        {
            "lead_name": "Dave Miller",
            "lead_email": "dave@citygov.org",
            "lead_phone": "555-0199",
            "inquiry_type": "Cybersecurity / Endpoint",
            "pain_points": ["Recent phishing attacks", "Managing remote devices"],
            "current_infrastructure": "McAfee on-prem, Windows 10",
            "budget": "Fiscal Year 2026 funds available",
            "timeline": "Needs solution by Q3",
            "competitors_or_blockers": ["Looking at Crowdstike directly"],
            "qualification_status": "Qualified - Hot",
            "amy_action": "Explained Insight's managed security wrapper",
            "recommended_next_steps": [
                "Schedule demo with Security Architect",
                "Send 'Secure Public Sector' case study"
            ],
            "followUpEmail": "<p>Hi Dave,</p><p>Thanks for discussing your endpoint security challenges today. Protecting remote devices is exactly where we're seeing public sector agencies focus right now.</p><p>I have looped in our Security Architect to prepare a comparison for your team.</p><p>Best,<br>Amy</p>"
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
