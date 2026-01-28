export const CONFIG = {
    GEMINI: {
        MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
    OPENAI: {
        MODEL: 'gpt-4o-mini',
    },
    TAVUS: {
        API_URL: 'https://tavusapi.com/v2',
        ENABLE_CONTEXT_UPDATE: process.env.ENABLE_TAVUS_CONTEXT === 'true',
    }
};
