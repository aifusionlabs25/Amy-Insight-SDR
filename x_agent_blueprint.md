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
- `app/api/tavus/route.ts` -> (Conversation Initializer)
- `app/api/tavus/end/route.ts` -> (Session Cleanup - **CRITICAL SOP**)
- `app/api/contact/route.ts` -> (Lead Gen Form)

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
  - **Important**: Replace `public/[agent].png` with new headshot.

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

### 1. Cartesia TTS Integration (CRITICAL)
- **Issue**: Sending `layers: { tts: ... }` in the Tavus API payload causes an "Unknown field" error (`{'layers': ['Unknown field.']}`).
- **Fix**: Do **NOT** send the `layers` object in the API call.
- **Bolt On 3**: **Email & Logic Templating**
  - **Purpose**: Defines who the agent is in emails and what data they extract.
  - **Files**: 
    - `lib/openai-service.ts`: Update `systemPrompt` (Role, Extraction Fields) and `LeadData` interface.
    - `app/api/webhook/route.ts`: Update Email HTML (Sender Name, Signature, Subject) and internal alert content.
    - `lib/google-sheets.ts`: Map new extracted fields to existing sheet columns.
  - **Action**: Search for "SDR" or "Intake" and replace with new persona domain (e.g. "Recruiter", "Support").
- **Solution**: Configure the Voice ID and TTS provider directly in the Tavus Persona Dashboard. The API should only pass `persona_id`, `conversational_context`, and other standard fields.

---

## 💡 Pro Tip for AI Assistance
When starting a new project, tell the AI:
> "I am building a new X Agent. Please read `.agent/workflows/x_agent_blueprint.md` and scaffold the project following the Core Engine vs Brand Skin pattern."
