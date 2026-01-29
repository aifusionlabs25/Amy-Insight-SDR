---
description: Master Blueprint (PRD & SOP) for creating new X Agents from zero to deployment.
top_level: true
---

# X Agent Replication Blueprint

This document serves as the **Master PRD and Standard Operating Procedure** for spinning up new AI Agents (like "James") for Knowles Law Firm or other clients.

**Philosophy**: Separation of **Core Engine** (reusable logic) and **Brand Skin** (customizable overlay).

---

## 🏗️ Phase 1: The Core Engine (Copy 1:1)
*These components provide the functionality and rarely need changes.*

### 1. Dependencies
- **Framework**: `Next.js` (App Router) + `Tailwind CSS`.
- **Key Libraries**: `@daily-co/daily-react` (Video), `resend` (Email).

### 2. The "CVI" Module (Video Interface)
**Copy Folder**: `app/components/cvi` -> `[New Repo]/app/components/cvi`
- Contains: `CVIProvider`, `Conversation`, `AudioWave`, `DeviceSelect`.
- **Rule**: Do not modify unless the underlying video provider (Tavus/Daily) changes.

### 3. API Infrastructure
**Copy Routes**:
- `app/api/auth/route.ts` -> (Simple Token Gate)
- `app/api/tavus/route.ts` -> (Conversation Initializer - **CRITICAL**: Use Dynamic Webhook detection)
- `app/api/tavus/end/route.ts` -> (Session Cleanup)
- `app/api/webhook/route.ts` -> (Logic Hub: AI Analysis + Resend + Sheets)
- `app/api/contact/route.ts` -> (Manual Lead Gen Form)
- `app/api/debug/route.ts` -> (Diagnostic Trace Endpoint)

### 4. Logic Utilities
- `lib/config.ts` -> Centralized ENV configuration.

---

## 🎨 Phase 2: The Brand Skin (Customize per Agent)
*These are the files you MUST modify for every new project.*

### 1. The Persona (The "Brain")
**File**: `lib/[agent]-prompt.ts` (e.g., `james-prompt.ts`)
- **Action**: Define the System Prompt.
- **Key Sections**: Identity, Greeting Protocol, Service Knowledge, Limitations.

### 2. The Aesthetic (The "Look")
**File**: `app/globals.css`
- **Action**: Update CSS Variables for the Client's Brand Colors.
  - `--gd-primary`: Main Brand Color.
  - `--gd-secondary`: Accent Color.
  - `--gd-bg`: Background gradients/textures.

### 3. The Access Gate (The "Entry")
**File**: `components/AccessGate.tsx`
- **Action**:
  - Replace "Knowles Law" text/logos.
  - Update `DEMO_ACCESS_TOKEN` logic if needed (or keep generic).
  - Modify the "Request Access" form fields if client needs different data.

### 4. The Stage (The "UI")
**File**: `components/InteractiveAvatar.tsx`
- **Action**:
  - Update the "Header" (Logo/Title).
  - Update the "Hero Section" (Agent Name, Role Description).
  - **Scaling Rule**: Use a `75vh` height cap on the video container and `max-w-4xl` to ensure 1:1 professional fit on 100% zoom browsers.
  - **Header Compression**: Reduce header `py` and top padding during active sessions to 90px to avoid bottom cutoff.
  - **Important**: Replace `public/[agent].png` with new headshot.

### 5. Branding Guardrails (CRITICAL Audit)
**Goal**: Zero residual branding from previous agents.
- **Audit Points**:
  - `lib/openai-service.ts`: System Prompt role and company name.
  - `app/api/webhook/route.ts`: Email signatures, subject lines, and sender names.
  - `app/api/contact/route.ts`: Email templates.
  - `lib/amy-prompt.ts`: The actual AI behavioral persona.
  - `app/layout.tsx`: Favicon and metadata titles.

## ✨ Phase 2.5: Formatting & Polish (End of Prototyping)
*Complete this step after the agent is functional but before final deployment.*

### 1. High-Fidelity TTS (Cartesia)
**Reason**: Better voice quality than standard models.
- **Action**:
  - Obtain `CARTESIA_API_KEY` and `CARTESIA_VOICE_ID`.
  - Add to `.env.local` and Vercel.
  - Test voice latency and emotion.


## 🧠 Phase 3: Intelligence & Logging (The "Gold Standard")
*Upgrade the agent from a simple chatbot to a business intelligence tool.*

### 1. OpenAI Lead Analysis
**File**: `lib/openai-service.ts`
- **Action**: Use the "Gold Standard" extraction prompt.
- **Key Fields**:
  - `risk_factors` (Red flags for the client).
  - `key_dates` (Incident timestamp, medical appts).
  - `attorney_action_plan` (Concrete next steps).
  - `incident_type` & `injury_list`.

### 2. Google Sheets Logging
**File**: `lib/google-sheets.ts`
- **Action**: Automatically append every conversation to a centralized Sheet.
- **Credentials**:
  - Create a Google Service Account.
  - Share the target Sheet with the Service Account Email (Editor access).
  - Add `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` to Vercel.

---

## 🚀 Phase 4: Deployment Checklist

### 1. Environment Variables (.env.local)
| Variable | Description |
| :--- | :--- |
| `DEMO_ACCESS_TOKEN` | Secure code for clients to enter. |
| `TAVUS_API_KEY` | From Tavus Dashboard. |
| `TAVUS_PERSONA_ID` | Unique ID for this specific agent's video replica. |
| `RESEND_API_KEY` | For sending lead emails. |
| `CARTESIA_API_KEY` | (Optional) High-fidelity TTS engine. |
| `CARTESIA_VOICE_ID` | (Optional) Specific voice UUID. |

### 2. Validation
- Run `/tavus_sop` verification (ensure termination logic exists).
- Test Audio/Video permissions.
- Verify "End Session" button works.

### 3. Go Live
- Push to GitHub.
- Import to Vercel.
- Paste ENVs.
- Deploy.

---

## ⚠️ Troubleshooting & Integration Notes

### 1. Hardcoded Webhook Branding (CRITICAL)
- **Issue**: Background emails still show old branding despite UI updates.
- **Root Cause**: The Tavus Dashboard global webhook is used as a fallback.
- **Fix**: **Dynamic Webhook Injection**. In `app/api/tavus/route.ts`, calculate the URL based on the current host and pass it explicitly in the `callback_url` property.
```typescript
const host = request.headers.get('host');
const protocol = host?.includes('localhost') ? 'http' : 'https';
const callbackUrl = `${protocol}://${host}/api/webhook`;
```

### 2. Diagnostic Logging (Harden the Pipe)
- **Problem**: Silent email failures or incorrect branding.
- **Solution**: Tracing. Log the full `LeadData` object, the calculated `callbackUrl`, and the exact `resend.emails.send` parameters (Subject, From, To) to the Vercel console.

### 3. Cartesia TTS Integration
- **Issue**: Sending `layers: { tts: ... }` in the Tavus API payload causes an "Unknown field" error.
- **Fix**: Configure the Voice ID directly in the Tavus Persona Dashboard. The API should only pass `persona_id` and context.

### 4. Video Cutoff & Scrolling
- **Solution**: Aggressive Viewport Scaling.
  - Set `.container` max-height to `75vh` in CSS.
  - Reduce main container `pt` to `90px` during active sessions.
  - Shift header elements up with `py-2` and shrink logo to `h-16`.

---

## 💡 Pro Tip for AI Assistance
When starting a new project, tell the AI:
> "I am building a new X Agent. Please read `.agent/workflows/x_agent_blueprint.md` and scaffold the project following the Core Engine vs Brand Skin pattern."
