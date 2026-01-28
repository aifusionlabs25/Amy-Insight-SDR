---
description: Standard Operating Procedure (SOP) for integrating Tavus CVI Video Agents.
---

# Tavus Integration SOP

This workflow asserts the MANDATORY requirements for any project using the Tavus Conversational Video Interface (CVI).

## 1. Critical Session Management (MANDATORY)
**Reason**: Failure to implement these steps results in "zombie sessions" that drain API credits.

### A. Backend Route: `api/tavus/end`
You MUST create a dedicated route to explicitly terminate sessions.

**File**: `app/api/tavus/end/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { conversation_id } = await request.json();
    if (!conversation_id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const response = await fetch(`https://tavusapi.com/v2/conversations/${conversation_id}/end`, {
        method: 'POST',
        headers: { 
            'x-api-key': process.env.TAVUS_API_KEY || '',
            'Content-Type': 'application/json' 
        },
    });
    
    return NextResponse.json({ success: response.ok });
}
```

### B. Frontend Cleanup Hook
You MUST implement a `beforeunload` listener in the main avatar component to catch tab closes/refreshes.

**Component**: `InteractiveAvatar.tsx` (or equivalent)
```typescript
useEffect(() => {
    const handleBeforeUnload = () => {
        if (!conversation?.conversation_id) return;
        // Use keepalive: true to ensure request fires during unload
        fetch('/api/tavus/end', {
            method: 'POST',
            body: JSON.stringify({ conversation_id: conversation.conversation_id }),
            keepalive: true, 
        });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [conversation]);
```

### C. UI Explicit End Button
Always provide a visible "End Session" or "Disconnect" button for the user that calls the end function manually.

## 2. Environment Variables
Ensure the following are always present in `.env.local` and your deployment platform (Vercel):
- `TAVUS_API_KEY`
- `TAVUS_PERSONA_ID`
- `DEMO_ACCESS_TOKEN` (if using AccessGate)

## 3. Deployment Checklist
- [ ] Verify `api/tavus/end` exists.
- [ ] Verify `keepalive: true` is used in the frontend fetch call.
- [ ] Verify Vercel Environment Variables are populated.
