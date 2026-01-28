
import OpenAI from 'openai';
import { CONFIG } from './config';

// Interface adapted for Legal Intake - ENHANCED for "Gold Standard"
export interface LeadData {
    lead_name: string;
    lead_email: string;
    lead_phone: string;

    // Case Details
    incident_date: string;
    incident_type: string;
    injuries: string[];
    medical_treatment: string;
    insurance_info: string;
    witnesses: string;
    police_report: string;

    // Rich Intelligence (The "Gold")
    case_summary: string;
    liability_assessment: string;
    risk_factors: string[]; // Potential issues (e.g. delayed treatment, pre-existing conditions)
    key_dates: string[]; // Any specific dates mentioned (incident, doctor appts, etc.)

    // Action Planning
    james_action: string; // What James did/promised
    attorney_action_plan: string[]; // Specific next steps for the firm (e.g. "Request outcome of MRI")

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
        You are a Senior Legal Intake Analyst for a top-tier Personal Injury Law Firm. Your job is to extract critical case information and formulate a strategic action plan from a client intake conversation.

        Analyze the transcript below and extract the key information into a JSON object.

        GUIDELINES:
        - **Be precise and fact-based.** Do not infer details not present.
        - **incident_type**: Classify as "Auto Accident", "Premises Liability", "Medical Malpractice", "Dog Bite", etc.
        - **injuries**: List specific physical injuries.
        - **risk_factors**: Identify any red flags or challenges (e.g., "Client waited 2 weeks to see doctor", "No police report filed", "Previous injury to same area").
        - **key_dates**: Extract ALL dates/times mentioned (Incident date, Date of first treatment, Upcoming appointments).
        - **attorney_action_plan**: Create a numbered list of concrete next steps for the Case Manager/Attorney (e.g., "Order Police Report from [City]", "Send representation letter to [Insurance Co]", "Schedule follow-up on [Date]").
        
        - **followUpEmail**: Write a warm, empathetic, professional follow-up email body (HTML text, <p>, <br>, <ul> only). 
          - Address the client by name.
          - Validating their choice to call ("You did the right thing by reaching out").
          - Re-state 1-2 key details to show active listening.
          - Clear next step: "Our Managing Attorney will review this immediately."
          - Sign off as "James".

        EXAMPLE OUTPUT FORMAT:
        {
            "lead_name": "Jane Doe",
            "lead_email": "jane@example.com",
            "lead_phone": "555-0199",
            "incident_date": "Oct 12th, roughly 2pm",
            "incident_type": "Auto Accident - Rear End",
            "injuries": ["Severe whiplash", "Numbness in left hand"],
            "medical_treatment": "ER immediately after; PCP follow-up scheduled",
            "insurance_info": "State Farm (Other Driver: Mike Smith)",
            "witnesses": "One bystander (contact info unknown)",
            "police_report": "Filed with Phoenix PD",
            "case_summary": "Client was stopped at red light on Camelback Rd when rear-ended at 40mph. Airbags deployed. Other driver apologized at scene.",
            "liability_assessment": "Clear Liability (Rear-end collision, admission of fault)",
            "risk_factors": ["Gap in treatment (missed PCP appt)", "Client unsure if they have UIM coverage"],
            "key_dates": ["Incident: Oct 12", "ER Visit: Oct 12", "Next Ortho Appt: Nov 1"],
            "james_action": "Confirmed contact info, advised not to speak to adjusters",
            "attorney_action_plan": [
                "Request collision report from Phoenix PD",
                "Send Letter of Rep to State Farm",
                "Verify client's UIM coverage limit"
            ],
            "followUpEmail": "<p>Hi Jane,</p><p>Thank you for trusting us with your story. I know dealing with the aftermath of a crash is overwhelming.</p><p>I have noted that you are experiencing numbness in your hand—please make sure to mention that to your doctor at your next appointment.</p><p>I have passed your file to our Case Review team. We will be in touch within 24 hours.</p>"
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
                incident_date: "Unknown",
                incident_type: "Unknown",
                injuries: ["Unknown"],
                medical_treatment: "Unknown",
                insurance_info: "Unknown",
                witnesses: "Unknown",
                police_report: "Unknown",
                case_summary: "Conversion processing failed or transcript too short.",
                liability_assessment: "Needs manual review",
                risk_factors: [],
                key_dates: [],
                james_action: "Attempted intake",
                attorney_action_plan: ["Manual Follow-up Required"],
                followUpEmail: "<p>Hello,</p><p>Thank you for speaking with Knowles Law Firm. We have received your information and a team member will reach out to you shortly.</p><p>Best regards,<br>James</p>"
            };
        }
    }
}
