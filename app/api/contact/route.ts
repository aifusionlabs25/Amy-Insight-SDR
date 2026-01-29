import { NextResponse } from 'next/server';
import { Resend } from 'resend';

let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
    if (!resendClient && process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

export async function POST(request: Request) {
    try {
        const { name, email, phone, company, companyName, message } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1E3A8A; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">🚀 IT Discovery Info - Insight</h2>
        </div>
        <div class="content">
            <div class="field"><span class="label">Name:</span> <span class="value">${name}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value"><a href="mailto:${email}">${email}</a></span></div>
            <div class="field"><span class="label">Phone:</span> <span class="value">${phone || 'Not provided'}</span></div>
            <div class="field"><span class="label">Message:</span> <p class="value" style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${message || 'No message provided'}</p></div>
        </div>
        <div class="footer">Submitted via User Interface • ${new Date().toLocaleString()}</div>
    </div>
</body>
</html>`.trim();

        const resend = getResendClient();
        if (resend) {
            await resend.emails.send({
                from: 'Amy Contact <noreply@aifusionlabs.app>',
                to: ['aifusionlabs@gmail.com'],
                subject: `Insight IT Discovery: ${name}`,
                html: emailHtml,
                replyTo: email,
            });

            await resend.emails.send({
                from: 'Insight Public Sector <noreply@aifusionlabs.app>',
                to: [email],
                subject: `We received your inquiry`,
                html: `<p>Hi ${name},<br><br>Thank you for reaching out to Insight Public Sector. We received your inquiry and a specialist will review it and contact you shortly.<br><br>Best regards,<br>Amy</p>`,
            });
        }

        return NextResponse.json({ success: true, message: "Thank you! We'll be in touch soon." });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
    }
}
