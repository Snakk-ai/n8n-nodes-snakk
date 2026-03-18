# n8n-nodes-snakk

n8n community node for [Snakk.ai](https://snakk.ai).

## What is Snakk.ai?

Snakk.ai is an AI voice agent platform that lets businesses automate phone calls with human-like AI agents. Built in Norway with a strong Nordic focus, but supporting 90+ languages worldwide. Snakk.ai can:

- **Handle inbound calls** — answer customer support, route callers, look up information in real-time
- **Make outbound calls** — proactive customer contact, appointment reminders, order confirmations, follow-ups
- **Extract structured data** — automatically pull key information from conversations
- **Record and summarize** — GDPR-compliant recording with AI-generated call summaries
- **Integrate via webhooks and tools** — the AI agent can call external APIs mid-conversation and receive results when calls end

## What this node does

This package adds two nodes to n8n:

### Snakk.ai (Action Node)

Perform operations on the Snakk.ai platform from any workflow:

| Resource | Operation | Description |
|----------|-----------|-------------|
| **Call** | Start Dynamic Call | Call a number with a custom AI agent built on-the-fly |
| **Call** | Start Call (Existing Agent) | Call using a pre-configured agent from your dashboard |
| **Call** | Get Call | Get call details including transcript, duration, and status |
| **Call** | List Calls | List all calls for your account |
| **Agent** | Create Agent | Create a new voice agent |
| **Agent** | Get Agent | Get agent details and configuration |
| **Agent** | List Agents | List all agents on your account |
| **Agent** | Update Agent | Update an agent's configuration |
| **Agent** | Duplicate Agent | Copy an agent with all its settings |
| **Agent** | Delete Agent | Delete an agent |
| **Phone Number** | List My Numbers | See your assigned phone numbers |
| **Phone Number** | List Available | See numbers available to claim |
| **Phone Number** | Claim / Assign / Unassign / Release | Manage phone number assignments |

**Key features:**
- **Dynamic Variables** — pass custom data and personalize every call with `{{variables}}`
- **Structured output** — define a JSON schema and let the AI extract structured data from conversations
- **Webhooks** — receive call results when calls end, including transcripts and summaries
- **GDPR-compliant recording** — with consent prompt or silent recording
- **Transfer to human** — let the AI agent hand off to a real person when needed
- **Usable as AI tool** — works with n8n's AI Agent node for autonomous workflows

### Snakk.ai Trigger (Webhook Node)

Starts a workflow automatically when a Snakk.ai event occurs:

| Event | Description |
|-------|-------------|
| **Call Ended** | Fires when a call finishes — includes transcript, duration, status, and summary |
| **Structured Output Ready** | Fires when AI-extracted structured data is available |
| **Any Event** | Catch-all for any webhook payload from Snakk.ai |

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

When a call ends, write the AI-generated summary and structured data back to the CRM record.

### Appointment reminder with fallback

```
[Schedule Trigger] → [CRM: Get Tomorrow's Appointments] → [Snakk.ai: Start Dynamic Call]
```

Call customers to remind them of upcoming appointments. If they don't answer, trigger a follow-up email or SMS.

### Invoice follow-up

```
[CRM Trigger: Invoice Overdue] → [Wait 7 days] → [Snakk.ai: Start Dynamic Call]
```

Automatically call customers with overdue invoices using a polite payment reminder agent.

## Dynamic Variables

Personalize every call by passing data as JSON and referencing it in your agent's instructions:

**Variables:**
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

Snakk.ai uses LiquidJS templates, so conditionals and formatting are supported:
```
{% if customerTier == "premium" %}Takk for at du er premium-kunde!{% endif %}
```

## Development

```bash
git clone https://github.com/Snakk-ai/n8n-nodes-snakk.git
cd n8n-nodes-snakk
npm install
npm run build
npm run dev      # watch mode
```

To test locally:

```bash
npm run build && npm link
cd ~/.n8n/custom
npm link n8n-nodes-snakk
# Restart n8n
```

## Links

- [Snakk.ai](https://snakk.ai)
- [API documentation](https://doc.snakk.ai/)
- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
