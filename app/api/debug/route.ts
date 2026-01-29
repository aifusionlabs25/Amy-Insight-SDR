import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function GET() {
    const environment = {
        VERCEL_ENV: process.env.VERCEL_ENV || 'development',
        VERCEL_URL: process.env.VERCEL_URL || 'localhost',
        HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY,
        HAS_TAVUS_KEY: !!process.env.TAVUS_API_KEY,
        HAS_RESEND_KEY: !!process.env.RESEND_API_KEY,
        HAS_SHEETS_ID: !!process.env.GOOGLE_SHEET_ID,
    };

    return NextResponse.json({
        message: "Insight Amy Diagnostic Trace",
        timestamp: new Date().toISOString(),
        config: CONFIG,
        environment: environment
    });
}
