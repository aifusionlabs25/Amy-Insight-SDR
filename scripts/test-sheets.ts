
const { GoogleSheetsService } = require('../lib/google-sheets');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testConnection() {
    console.log('🔍 Testing Google Sheets Connection...');
    console.log('----------------------------------------');

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    console.log(`📄 Sheet ID: ${sheetId ? '✅ Found' : '❌ Missing'}`);
    console.log(`📧 Client Email: ${clientEmail ? '✅ Found (' + clientEmail + ')' : '❌ Missing'}`);
    console.log(`🔑 Private Key: ${privateKey ? '✅ Found' : '❌ Missing'}`);

    if (!sheetId || !clientEmail || !privateKey) {
        console.error('\n❌ STOP: Missing required environment variables. Please update .env.local');
        return;
    }

    const service = new GoogleSheetsService();

    const testData = {
        conversation_id: 'test-connectivity-' + Date.now(),
        lead_name: 'Connectivity Test',
        lead_email: 'test@example.com',
        incident_type: 'System Check',
        case_summary: 'Verifying Google Sheets Integration'
    };

    console.log('\n🚀 Attempting to append test row...');
    const success = await service.appendLead(testData);

    if (success) {
        console.log('\n✅ SUCCESS: Test row appended to Google Sheet!');
        console.log('Please check the sheet to confirm.');
    } else {
        console.error('\n❌ FAILED: Could not append row.');
        console.log('Troubleshooting tips:');
        console.log('1. Did you SHARE the Google Sheet with the Service Account Email? (Must be "Editor")');
        console.log('2. Is the "Private Key" formatted correctly? (One long string with \\n or actual newlines)');
    }
}

testConnection();
