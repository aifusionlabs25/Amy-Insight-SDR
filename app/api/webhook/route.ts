
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OpenAIService } from '@/lib/openai-service';
import { CONFIG } from '@/lib/config';

// Allow webhook to run for up to 60 seconds (Vercel Limit)
export const maxDuration = 60;

// Normalize Transcript Helper
function normalizeTranscript(rawTranscript: any): string {
    if (!rawTranscript) return "";
    if (typeof rawTranscript === 'string') return rawTranscript;
    if (Array.isArray(rawTranscript)) {
        const seen = new Set<string>();
        return rawTranscript
            .map((t: any) => {
                const role = t.role || t.sender || 'unknown';
                const content = t.content || t.text || t.message || '';
                if (role.toLowerCase() === 'system' || !content) return null;
                const line = `${role}: ${content}`;
                if (seen.has(line)) return null;
                seen.add(line);
                return line;
            })
            .filter(Boolean)
            .join('\n');
    }
    try { return JSON.stringify(rawTranscript); } catch { return ""; }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const eventType = body.event_type || 'unknown';
        const conversation_id = body.conversation_id;

        console.log(`[Webhook] Received event: ${eventType} from conversation: ${conversation_id}`);

        // ACK Shutdown
        if (eventType === 'system.shutdown') {
            return NextResponse.json({ message: 'Shutdown acknowledged' });
        }

        // TRIGGER ON TRANSCRIPTION_READY
        if (eventType === 'application.transcription_ready') {
            console.log(`[Webhook] 📜 Transcript Ready for ${conversation_id}. Starting Intake Analysis...`);

            let transcriptText = "";
            let tavusRecordingUrl: string | null = null;
            let leadData: any = null;

            // 1. Get Transcript from Payload
            if (body.properties && body.properties.transcript) {
                transcriptText = normalizeTranscript(body.properties.transcript);
            } else if (body.transcript) {
                transcriptText = normalizeTranscript(body.transcript);
            }

            // 2. Sync with Tavus API (for Recording URL)
            if (process.env.TAVUS_API_KEY) {
                try {
                    const transcriptResponse = await fetch(`${CONFIG.TAVUS.API_URL}/conversations/${conversation_id}?verbose=true`, {
                        method: 'GET',
                        headers: { 'x-api-key': process.env.TAVUS_API_KEY },
                    });

                    if (transcriptResponse.ok) {
                        const convoData = await transcriptResponse.json();
                        if (convoData.recording_url) {
                            tavusRecordingUrl = convoData.recording_url;
                            console.log('[Webhook] ✅ Captured Public Recording URL:', tavusRecordingUrl);
                        }
                    }
                } catch (err) {
                    console.error(`[Webhook] API fetch failed:`, err);
                }
            }

            // 3. AI Analysis
            if (transcriptText && transcriptText.length >= 50) {
                const aiService = new OpenAIService();
                try {
                    leadData = await aiService.analyzeTranscript(transcriptText);
                } catch (error) {
                    console.error('[Webhook] ❌ AI Analysis Failed - using fallback');
                }

                // OVERRIDE WITH VERIFIED USER DATA
                if (body.properties && body.properties.user_email) {
                    if (!leadData) leadData = {};
                    leadData.lead_email = body.properties.user_email;
                    if (body.properties.user_name) leadData.lead_name = body.properties.user_name;
                    console.log('[Webhook] 📧 Enforcing Verified User Identity:', leadData.lead_email);
                }

                if (leadData) {
                    console.log('[Webhook] Sending Emails via Resend...');

                    if (process.env.RESEND_API_KEY) {
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        const recipient = leadData.lead_email || 'aifusionlabs@gmail.com';

                        // A. User Follow-up Email
                        const emailBodyHtml = `
                        <div style="font-family: serif; padding: 20px; line-height: 1.6; color: #111;">
                            <p style="white-space: pre-line;">${leadData.followUpEmail}</p>
                            <br>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p style="color: #444; font-size: 0.9em;">
                                <strong>James</strong><br>
                                Senior Legal Intake Specialist<br>
                                <span style="color: #EAB308;">Knowles Law Firm & Associates</span><br>
                                Privileged & Confidential
                            </p>
                        </div>
                        `;

                        // Using safe verified sender
                        await resend.emails.send({
                            from: 'James at Knowles Law <noreply@aifusionlabs.app>',
                            to: [recipient, 'aifusionlabs@gmail.com'],
                            subject: `Case Review: Next Steps`,
                            html: emailBodyHtml
                        });
                        console.log('✅ [Webhook] Sent "James" email to:', recipient);


                        // B. Internal Lead Alert
                        const internalBodyHtml = `
                        <div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
                            <div style="border-bottom: 2px solid #EAB308; padding-bottom: 10px; margin-bottom: 15px;">
                                <h2 style="color: #EAB308; margin: 0;">⚖️ New Case Intake</h2>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Conversation ID: ${conversation_id}</p>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div>
                                    <h3 style="margin-bottom: 10px; color: #111;">👤 Client</h3>
                                    <p style="margin: 5px 0;"><strong>Name:</strong> ${leadData.lead_name}</p>
                                    <p style="margin: 5px 0;"><strong>Email:</strong> ${leadData.lead_email}</p>
                                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${leadData.lead_phone}</p>
                                </div>
                                <div>
                                    <h3 style="margin-bottom: 10px; color: #111;">🚗 Incident</h3>
                                    <p style="margin: 5px 0;"><strong>Type:</strong> ${leadData.incident_type}</p>
                                    <p style="margin: 5px 0;"><strong>Date:</strong> ${leadData.incident_date}</p>
                                    <p style="margin: 5px 0;"><strong>Liability:</strong> ${leadData.liability_assessment}</p>
                                </div>
                            </div>
                            
                            <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">

                            <h3 style="color: #111;">📅 Key Dates</h3>
                            <ul style="background: #eef2ff; padding: 15px 20px; border-radius: 4px; border: 1px solid #c7d2fe;">
                                ${(leadData.key_dates || []).length > 0 ? (leadData.key_dates || []).map((d: string) => `<li>${d}</li>`).join('') : '<li>No specific dates mentioned</li>'}
                            </ul>

                            <h3 style="color: #111;">🏥 Injuries & Damages</h3>
                            <ul style="background: #fff; padding: 15px 20px; border-radius: 4px; border: 1px solid #e5e5e5;">
                                ${(leadData.injuries || []).map((p: string) => `<li>${p}</li>`).join('')}
                            </ul>
                            <p><strong>Treatment:</strong> ${leadData.medical_treatment}</p>

                            <h3 style="color: #DC2626;">🚩 Risk Factors / Red Flags</h3>
                            ${(leadData.risk_factors || []).length > 0
                                ? `<ul style="background: #fee2e2; padding: 15px 20px; border-radius: 4px; border: 1px solid #fecaca; color: #991b1b;">
                                    ${(leadData.risk_factors || []).map((r: string) => `<li>${r}</li>`).join('')}
                                   </ul>`
                                : `<p style="color: #166534; background: #dcfce7; padding: 10px; border-radius: 4px;">✅ No obvious risk factors detected.</p>`
                            }

                            <h3 style="color: #111;">📋 Case Summary</h3>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                                ${leadData.case_summary}
                            </div>

                            <div style="background: #fffbeb; padding: 20px; border-radius: 6px; border: 2px solid #EAB308;">
                                <h3 style="margin-top: 0; color: #B45309;">🚀 Attorney Action Plan</h3>
                                <ul style="margin-bottom: 0;">
                                    ${(leadData.attorney_action_plan || []).map((step: string) => `<li><strong>${step}</strong></li>`).join('')}
                                </ul>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                ${tavusRecordingUrl
                                ? `<a href="${tavusRecordingUrl}" style="background-color: #111; color: #EAB308; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Intake Recording</a>`
                                : `<span>Recording Processing...</span>`
                            }
                            </div>
                        </div>
                        `;

                        await resend.emails.send({
                            from: 'Intake System <alerts@aifusionlabs.app>',
                            to: 'aifusionlabs@gmail.com',
                            subject: `[NEW INTAKE] ${leadData.incident_type} - ${leadData.lead_name}`,
                            html: internalBodyHtml
                        });
                        console.log('✅ [Webhook] Sent Internal Alert.');

                        // C. Log to Google Sheets
                        console.log('[Webhook] 📊 Preparing to log to Google Sheets...');
                        console.log(`[Webhook] Sheet ID Present: ${!!process.env.GOOGLE_SHEET_ID}`);

                        if (process.env.GOOGLE_SHEET_ID) {
                            try {
                                const { GoogleSheetsService } = await import('@/lib/google-sheets');
                                const sheetsService = new GoogleSheetsService();
                                const success = await sheetsService.appendLead({
                                    conversation_id,
                                    ...leadData,
                                    tavus_recording_url: tavusRecordingUrl
                                });
                                console.log(`[Webhook] Sheet Append Result: ${success ? 'SUCCESS' : 'FAILURE'}`);
                            } catch (sheetErr) {
                                console.error('⚠️ [Webhook] Google Sheets Logging Failed:', sheetErr);
                            }
                        } else {
                            console.warn('[Webhook] ⚠️ Skipping Sheets Logging: GOOGLE_SHEET_ID is missing.');
                        }


                    } else {
                        console.error('❌ [Webhook] RESEND_API_KEY missing.');
                    }
                }
            } else {
                console.warn(`[Webhook] Transcript too short (${transcriptText.length} chars).`);
            }

            return NextResponse.json({ message: 'Event processed' });
        }

        console.log(`[Webhook] Ignoring event: ${eventType}`);
        return NextResponse.json({ message: 'Ignored' });

    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
