# n8n-nodes-snakk

[n8n](https://n8n.io/) community node for [Snakk.ai](https://snakk.ai) — the Nordic AI voice agent platform.

Start outbound AI calls, manage agents, and receive call event webhooks — all from your n8n workflows.

## Nodes

### Snakk.ai

Perform actions on the Snakk.ai platform:

| Resource | Operation | Description |
|----------|-----------|-------------|
| **Call** | Start Dynamic Call | Call a number with a custom agent built on-the-fly |
| **Call** | Start Call (Existing Agent) | Call using a pre-configured agent |
| **Call** | List Calls | Get all calls for your account |
| **Agent** | List Agents | Get all agents |
| **Agent** | Create Agent | Create a new voice agent |

### Snakk.ai Trigger

Webhook trigger that fires on Snakk.ai call events:

- **Call Ended** — when a call finishes (includes transcript, duration, status)
- **Structured Output Ready** — when AI-extracted data is available
- **Any Event** — catch-all for any webhook payload

## Installation

### Community Node (recommended)

1. Go to **Settings → Community Nodes** in your n8n instance
2. Enter `n8n-nodes-snakk`
3. Click **Install**

### Manual

```bash
cd ~/.n8n/custom
npm install n8n-nodes-snakk
```

Then restart n8n.

## Credentials

You need a Snakk.ai API key:

1. Sign up at [snakk.ai](https://snakk.ai)
2. Go to your dashboard → API Keys
3. In n8n, go to **Credentials → New → Snakk.ai API**
4. Paste your API key

## Example: Auto-call new Lime CRM leads

```
[Lime CRM Trigger] → [Snakk.ai: Start Dynamic Call]
```

1. Lime CRM trigger fires when a new lead is created
2. Snakk.ai node calls the lead with a personalized pitch

## Example: Log call results back to CRM

```
[Snakk.ai Trigger: Call Ended] → [Lime CRM: Update Record]
```

1. Snakk.ai trigger fires when a call ends
2. Write the call summary and transcript back to the CRM record

## Development

```bash
npm install
npm run build
npm run dev   # watch mode
```

## License

MIT
