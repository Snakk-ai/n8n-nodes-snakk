# n8n-nodes-snakk

Community nodes for [Snakk.ai](https://snakk.ai), with voice-agent management, inbound number routing, call retrieval, outbound actions, and authenticated after-call events.

**Verification status:** version 0.1.4 is published on npm but has no npm provenance. This working revision prepares 0.2.0; it is not an n8n approval or a tested Lime CRM release.

## Inbound customer support

Snakk answers the incoming phone call. During the conversation, a Snakk HTTP tool can request information from an n8n workflow and use the returned result in its spoken answer:

```text
Caller → Snakk voice agent
              ↓ synchronous HTTPS tool request
         n8n Webhook (authenticated)
              → verify caller identity and customer access
              → query the customer's CRM
              → return a small structured result
         Respond to Webhook
              ↓ same HTTP response
         Snakk answers the caller
```

Use n8n's **Webhook** node with authentication and its response mode set to **Using Respond to Webhook Node**. Connect all success and handled error paths to **Respond to Webhook**. Protect the webhook with a dedicated credential; configure its header in the Snakk tool's `webhook_headers`. Keep CRM credentials in n8n credentials, and select the tenant connection from trusted configuration.

**The Snakk Trigger in this package is for AFTER the call.** It acknowledges an authenticated delivery immediately and cannot return a CRM lookup result to an ongoing call. Installing this package does not create a ready-made Lime CRM integration. A synchronous workflow using n8n's built-in nodes can work independently of this package's verification status, subject to that environment's availability and configuration.

Snakk documents [custom tools during a conversation](https://doc.snakk.ai/add-toolwebhook-to-agent-24821788e0), [tool creation](https://doc.snakk.ai/create-tool-38622979e0), and [native integration actions during a call](https://doc.snakk.ai/execute-an-integration-action-during-a-call-38623094e0). The native integration framework also supports `during_call`, `end_of_call`, and `both`. These are separate integration mechanisms; a custom-tool timeout must not be assumed to equal the partner integration timeout without testing it.

For partner HTTP actions, the [partner guide](https://doc.snakk.ai/partner-developer-documentation-2082339m0) documents a 5-second default timeout, 10-second maximum, and a 1 MB response limit. Return only the fields the agent needs. Set a shorter CRM timeout so the workflow can return a clear unavailable response before the outer request expires.

Caller ID, a spoken name, or a supplied case number is not proof of access. Verify identity through a trusted mechanism and check case ownership within the correct tenant before returning private data. Do not accept a caller-supplied `tenant_id`, connection ID, or boolean `verified` as authorization. On failed verification, timeout, or CRM failure, return a neutral error without private case details and let the agent explain that it cannot retrieve the information.

## Nodes and operations

| Resource | Operations |
| --- | --- |
| Agent | Create, get, list, update, duplicate, delete |
| Call | Get, list, start with an existing agent, start with an inline agent |
| Phone Number | List owned numbers, list pool numbers, claim, assign to agent, unassign, release |
| Trigger | Call ended, structured output present, any authenticated webhook payload |

Call listing returns the API response page. It does not currently retrieve all pages automatically. Phone-number claim may incur a monthly charge under your Snakk plan; confirm that before running that action.

## Installation and credentials

For a self-hosted n8n instance with community packages enabled, install `n8n-nodes-snakk` under Settings → Community Nodes. n8n Cloud discovery requires approval as a verified community package.

Create a **Snakk.ai API** credential with:

- **API Key:** the key for the intended Snakk account.
- **Base URL:** `https://api.snakk.ai`. Existing saved credentials must be updated manually if they use the retired Railway hostname.
- **Webhook Secret:** for triggers only, a dedicated random secret of at least 32 characters. Keep it separate from the API key.

The credential test calls `GET /api/tenants/me`. Unlike `/health`, this endpoint rejects an invalid API key.

## After-call trigger setup

1. Select the Snakk API credential and the **Agent ID** in the trigger.
2. Make sure n8n advertises a publicly reachable HTTPS webhook URL.
3. Activate the workflow. The node registers a standard enriched after-call webhook through `/api/end-of-call-webhooks` with the dedicated `X-Snakk-Webhook-Secret` header.
4. Connect downstream steps that process the delivered call data.

The trigger verifies the header before producing any workflow data. It acknowledges filtered events too, preventing unnecessary retries. Deactivation removes the callback ID stored by this node. If the API fails during cleanup, the error is surfaced and the ID is retained so cleanup can be retried.

Do not attach a Respond to Webhook node to this after-call trigger: it already sends its own response. For live tool calls, use the separate synchronous workflow described above. CRM writes after the call should be idempotent per call and action so retries do not create duplicate notes.

The standard after-call payload shape still needs an authenticated end-to-end fixture check before release. The existing filter retains the `status` / `structured_output` behavior from 0.1.4; custom body templates must match the selected event or use Any Event.

## Migration from 0.1.4

0.2.0 includes configuration changes that require review of existing workflows:

- Set saved credential Base URL to `https://api.snakk.ai`.
- Add the dedicated Webhook Secret and Agent ID before reactivating a trigger. The old unauthenticated manually configured webhook is not automatically removed; remove it from Snakk once the new delivery is confirmed to avoid duplicate events.
- Phone-number mutations now require the **record ID**, not the E.164 phone number. Get that ID from the owned-number or pool response. Fill the new Phone Number ID field in existing workflows.
- Agent updates now use PATCH. Existing field names remain available.
- The newer number-assignment documentation uses `agentId`; an older duplicate page uses `agent_id`. This revision follows the newer endpoint page and the current backend route schema; deployed behavior still needs confirmation in the test tenant.

## Language scope

The node interface and documentation are in English. Existing agent-language selectors expose Norwegian (`no`), English (`en`), Swedish (`sv`), and Danish (`da`). These selectors do **not** establish which languages a Lime integration has been tested to support; that requires end-to-end validation of the specific agent and workflow.

## Development and verification

```bash
npm ci --ignore-scripts
npm run lint
npm run typecheck
npm test
npm pack --dry-run
```

Tests execute the built node metadata and webhook lifecycle/handler with synthetic API responses. They verify routes, request fields, authentication rejection, registration, reuse, filtering, and cleanup. They do not call customers or a live CRM.

See [Release checklist](docs/release-checklist.md) for the separate requirements for repository visibility, npm trusted publishing, provenance, and Creator Portal submission. The original published icon PNG is retained; the node currently uses the unmodified official SVG wordmark from the Snakk website. Review its appearance on both n8n themes before release.

## License

MIT
