# n8n-nodes-snakk

n8n community node for [Snakk.ai](https://snakk.ai).

## What is Snakk.ai?

Snakk.ai is a Nordic AI voice agent platform that lets businesses automate phone calls with human-like AI agents. The platform supports Norwegian, Swedish, Danish, and English, and can:

- **Handle inbound calls** — answer customer support, route callers, look up information in real-time
- **Make outbound calls** — proactive customer contact, appointment reminders, order confirmations, follow-ups
- **Extract structured data** — automatically pull key information from conversations (customer satisfied? questions answered?)
- **Record and summarize** — GDPR-compliant recording with AI-generated call summaries
- **Integrate via webhooks and tools** — the AI agent can call external APIs mid-conversation and receive results when calls end

Snakk.ai is built for the Nordics and optimized for Nordic languages and business use cases.

## What this node does

This package adds two nodes to n8n:

### Snakk.ai (Action Node)

Perform operations on the Snakk.ai platform from any workflow:

| Resource | Operation | Description |
|----------|-----------|-------------|
| **Call** | Start Dynamic Call | Call a number with a custom AI agent built on-the-fly. Full control over instructions, voice, language, recording, webhooks, and dynamic variables. |
| **Call** | Start Call (Existing Agent) | Call a number using a pre-configured agent from your Snakk.ai dashboard. |
| **Call** | Get Call | Get details for a specific call (transcript, duration, status, recording). |
| **Call** | List Calls | List all calls for your account. |
| **Agent** | Create Agent | Create a new persistent voice agent. |
| **Agent** | Get Agent | Get details for a specific agent. |
| **Agent** | List Agents | List all agents on your account. |
| **Agent** | Update Agent | Update an existing agent's configuration. |
| **Agent** | Delete Agent | Delete an agent. |

**Key features:**
- **Dynamic Variables** — pass custom data (`{"name": "Kari", "orderId": "12345"}`) and reference them in prompts with `{{name}}`, `{{orderId}}`
- **6 AI voices** — Marin, Ash, Coral, Sage, Alloy, Echo
- **4 languages** — Norwegian, English, Swedish, Danish
- **Structured output** — define a JSON schema and the AI extracts structured data from the conversation
- **Webhooks** — receive call results when calls end, including transcripts and summaries
- **Recording** — GDPR-compliant with consent prompt, or silent recording
- **Transfer to human** — let the AI agent hand off to a real person when needed
- **Usable as AI tool** — the node has `usableAsTool: true`, so it works with n8n's AI Agent node

### Snakk.ai Trigger (Webhook Node)

Starts a workflow automatically when a Snakk.ai event occurs:

| Event | Description |
|-------|-------------|
| **Call Ended** | Fires when a call finishes. Payload includes transcript, duration, status, call summary, and dynamic variables. |
| **Structured Output Ready** | Fires when AI-extracted structured data is available. |
| **Any Event** | Catch-all for any webhook payload from Snakk.ai. |

Use this to build reactive workflows — for example, write call results back to a CRM, send follow-up emails, or update a ticket.

## Installation

### Community Node (recommended)

1. In your n8n instance, go to **Settings → Community Nodes**
2. Enter `n8n-nodes-snakk`
3. Click **Install**
4. Restart n8n if prompted

### Manual installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-snakk
# Restart n8n
```

## Setup

1. Sign up at [snakk.ai](https://snakk.ai)
2. Go to your dashboard and create an API key
3. In n8n, go to **Credentials → New → Snakk.ai API**
4. Paste your API key
5. (Optional) Change the Base URL if you're using a custom deployment

The credential includes a built-in connection test that verifies your API key works.

## Example workflows

### Auto-call new CRM leads

```
[CRM Trigger: New Lead] → [Snakk.ai: Start Dynamic Call]
```

When a new lead is created in your CRM, Snakk.ai automatically calls them with a personalized pitch based on the lead data.

### Log call results back to CRM

```
[Snakk.ai Trigger: Call Ended] → [CRM: Create History Note]
```

When a call ends, write the AI-generated summary, transcript, and structured data (customer satisfied? understood the solution?) back to the CRM record.

### Appointment reminder with fallback

```
[Schedule Trigger] → [CRM: Get Tomorrow's Appointments] → [Snakk.ai: Start Dynamic Call]
```

Every evening, call customers to remind them of tomorrow's appointments. If they don't answer, a follow-up workflow sends an email or SMS.

### Invoice follow-up

```
[CRM Trigger: Invoice Overdue] → [Wait 7 days] → [Snakk.ai: Start Dynamic Call]
```

Automatically call customers with overdue invoices using a polite payment reminder agent.

## Dynamic Variables

Dynamic variables let you personalize every call. Pass data as JSON and reference it in your instructions:

**Variables input:**
```json
{
  "name": "Kari Hansen",
  "orderNumber": "12345",
  "amount": "499 kr"
}
```

**Instructions:**
```
Hei {{name}}! Vi ringer for å bekrefte ordre {{orderNumber}} på {{amount}}.
```

Snakk.ai uses LiquidJS for templates, so you can also use conditionals and date formatting:
```
{% if customerTier == "premium" %}Takk for at du er premium-kunde!{% endif %}
```

## Development

```bash
git clone https://github.com/Snakk-ai/n8n-nodes-snakk.git
cd n8n-nodes-snakk
npm install
npm run build    # compile TypeScript
npm run dev      # watch mode
```

To test locally, link the package to your n8n instance:

```bash
npm run build
npm link
cd ~/.n8n/custom  # or ~/.n8n/nodes
npm link n8n-nodes-snakk
# Restart n8n
```

## Links

- [Snakk.ai website](https://snakk.ai)
- [Snakk.ai API documentation](https://doc.snakk.ai/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
