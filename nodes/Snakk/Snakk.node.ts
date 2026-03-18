import { NodeConnectionTypes } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Snakk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Snakk.ai',
		name: 'snakk',
		icon: 'file:snakk.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'AI voice agent platform — start calls, manage agents, and more',
		defaults: {
			name: 'Snakk.ai',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'snakkApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// ── Resource selector ─────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Call', value: 'call' },
					{ name: 'Agent', value: 'agent' },
				],
				default: 'call',
			},

			// ══════════════════════════════════════════════════════════
			//  CALL operations
			// ══════════════════════════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['call'] } },
				options: [
					{
						name: 'Start Dynamic Call',
						value: 'startDynamic',
						action: 'Start an outbound call with ad-hoc agent config',
						description: 'Call a number with a custom agent built on-the-fly',
						routing: {
							request: {
								method: 'POST',
								url: '/api/calls/outbound-dynamic',
							},
						},
					},
					{
						name: 'Start Call (Existing Agent)',
						value: 'startExisting',
						action: 'Start an outbound call using an existing agent',
						description: 'Call a number using a pre-configured agent from your dashboard',
						routing: {
							request: {
								method: 'POST',
								url: '/api/calls/outbound',
							},
						},
					},
					{
						name: 'List Calls',
						value: 'list',
						action: 'List all calls',
						description: 'Get a list of all calls for your account',
						routing: {
							request: {
								method: 'GET',
								url: '/api/calls',
							},
						},
					},
				],
				default: 'startDynamic',
			},

			// ── Start Dynamic Call fields ─────────────────────────────
			{
				displayName: 'To Number',
				name: 'toNumber',
				type: 'string',
				required: true,
				default: '',
				placeholder: '+4712345678',
				description: 'E.164 phone number to call',
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				routing: {
					send: { type: 'body', property: 'toNumber' },
				},
			},
			{
				displayName: 'Instructions',
				name: 'instructions',
				type: 'string',
				typeOptions: { rows: 6 },
				required: true,
				default: '',
				placeholder: 'Du er en kundeservice-agent som...',
				description: 'System prompt / instructions for the AI agent. Supports {{variables}} from Dynamic Variables.',
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				routing: {
					send: { type: 'body', property: 'agentConfig.instructions' },
				},
			},
			{
				displayName: 'Greeting Message',
				name: 'greetingMessage',
				type: 'string',
				default: '',
				placeholder: 'Hei! Jeg ringer fra...',
				description: 'First message the agent says when the call connects',
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				routing: {
					send: { type: 'body', property: 'agentConfig.greeting_message' },
				},
			},
			{
				displayName: 'Additional Call Options',
				name: 'callOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				options: [
					{
						displayName: 'Agent Name',
						name: 'agentName',
						type: 'string',
						default: '',
						description: 'Display name for this ad-hoc agent',
						routing: {
							send: { type: 'body', property: 'agentConfig.name' },
						},
					},
					{
						displayName: 'Voice',
						name: 'voice',
						type: 'options',
						options: [
							{ name: 'Marin', value: 'marin' },
							{ name: 'Ash', value: 'ash' },
							{ name: 'Coral', value: 'coral' },
							{ name: 'Sage', value: 'sage' },
							{ name: 'Alloy', value: 'alloy' },
							{ name: 'Echo', value: 'echo' },
						],
						default: 'marin',
						routing: {
							send: { type: 'body', property: 'agentConfig.voice' },
						},
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Norwegian', value: 'no' },
							{ name: 'English', value: 'en' },
							{ name: 'Swedish', value: 'sv' },
							{ name: 'Danish', value: 'da' },
						],
						default: 'no',
						routing: {
							send: { type: 'body', property: 'agentConfig.language' },
						},
					},
					{
						displayName: 'From Number',
						name: 'fromNumber',
						type: 'string',
						default: '',
						placeholder: '+4787654321',
						description: 'Specific number to call from (must be assigned to your account)',
						routing: {
							send: { type: 'body', property: 'fromNumber' },
						},
					},
					{
						displayName: 'Recording Enabled',
						name: 'recordingEnabled',
						type: 'boolean',
						default: true,
						description: 'Whether to ask for consent and record the call',
						routing: {
							send: { type: 'body', property: 'agentConfig.recording_enabled' },
						},
					},
					{
						displayName: 'Recording Prompt',
						name: 'recordingPrompt',
						type: 'string',
						default: '',
						placeholder: 'Denne samtalen kan bli tatt opp...',
						routing: {
							send: { type: 'body', property: 'agentConfig.recording_prompt' },
						},
					},
					{
						displayName: 'Transfer Enabled',
						name: 'transferEnabled',
						type: 'boolean',
						default: false,
						description: 'Whether to allow the agent to transfer to a human',
						routing: {
							send: { type: 'body', property: 'agentConfig.transfer_enabled' },
						},
					},
					{
						displayName: 'Transfer Number',
						name: 'transferNumber',
						type: 'string',
						default: '',
						placeholder: '+4795837050',
						description: 'Phone number to transfer to if transfer is enabled',
						routing: {
							send: { type: 'body', property: 'agentConfig.transfer_number' },
						},
					},
					{
						displayName: 'Summary Prompt',
						name: 'summaryPrompt',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
						placeholder: 'Oppsummer samtalen kort på norsk...',
						description: 'Prompt for AI to generate a call summary',
						routing: {
							send: { type: 'body', property: 'agentConfig.summary_prompt' },
						},
					},
					{
						displayName: 'End Call Webhook',
						name: 'endCallWebhook',
						type: 'string',
						default: '',
						placeholder: 'https://your-app.com/api/webhook',
						description: 'URL to receive a POST when the call ends',
						routing: {
							send: { type: 'body', property: 'agentConfig.end_call_webhook' },
						},
					},
					{
						displayName: 'Structured Output Enabled',
						name: 'structuredOutputEnabled',
						type: 'boolean',
						default: false,
						description: 'Whether to extract structured data from the call',
						routing: {
							send: { type: 'body', property: 'agentConfig.structured_output_enabled' },
						},
					},
					{
						displayName: 'Structured Output Schema (JSON)',
						name: 'structuredOutputSchema',
						type: 'json',
						default: '',
						description: 'JSON Schema defining what data to extract',
						routing: {
							send: { type: 'body', property: 'agentConfig.structured_output_schema' },
						},
					},
					{
						displayName: 'Structured Output Prompt',
						name: 'structuredOutputPrompt',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'agentConfig.structured_output_prompt' },
						},
					},
					{
						displayName: 'Structured Output Webhook',
						name: 'structuredOutputWebhook',
						type: 'string',
						default: '',
						placeholder: 'https://your-app.com/api/webhook',
						routing: {
							send: { type: 'body', property: 'agentConfig.structured_output_webhook' },
						},
					},
				],
			},
			{
				displayName: 'Dynamic Variables (JSON)',
				name: 'dynamicVariables',
				type: 'json',
				default: '',
				placeholder: '{"name": "Kari", "orderId": "12345"}',
				description: 'Custom variables for template personalization in instructions/greeting. Use {{variableName}} in prompts.',
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				routing: {
					send: { type: 'body', property: 'dynamicVariables' },
				},
			},

			// ── Start Existing Agent Call fields ──────────────────────
			{
				displayName: 'To Number',
				name: 'toNumberExisting',
				type: 'string',
				required: true,
				default: '',
				placeholder: '+4712345678',
				description: 'E.164 phone number to call',
				displayOptions: {
					show: { resource: ['call'], operation: ['startExisting'] },
				},
				routing: {
					send: { type: 'body', property: 'toNumber' },
				},
			},
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'agent-uuid-here',
				description: 'UUID of the existing agent to use',
				displayOptions: {
					show: { resource: ['call'], operation: ['startExisting'] },
				},
				routing: {
					send: { type: 'body', property: 'agentId' },
				},
			},
			{
				displayName: 'Dynamic Variables (JSON)',
				name: 'dynamicVariablesExisting',
				type: 'json',
				default: '',
				placeholder: '{"name": "Kari"}',
				description: 'Custom variables for template personalization',
				displayOptions: {
					show: { resource: ['call'], operation: ['startExisting'] },
				},
				routing: {
					send: { type: 'body', property: 'dynamicVariables' },
				},
			},

			// ══════════════════════════════════════════════════════════
			//  AGENT operations
			// ══════════════════════════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['agent'] } },
				options: [
					{
						name: 'List Agents',
						value: 'list',
						action: 'List all agents',
						routing: {
							request: {
								method: 'GET',
								url: '/api/agents',
							},
						},
					},
					{
						name: 'Create Agent',
						value: 'create',
						action: 'Create a new agent',
						routing: {
							request: {
								method: 'POST',
								url: '/api/agents',
							},
						},
					},
				],
				default: 'list',
			},

			// ── Create Agent fields ──────────────────────────────────
			{
				displayName: 'Agent Name',
				name: 'agentNameCreate',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Support Agent',
				displayOptions: {
					show: { resource: ['agent'], operation: ['create'] },
				},
				routing: {
					send: { type: 'body', property: 'name' },
				},
			},
			{
				displayName: 'Instructions',
				name: 'agentInstructions',
				type: 'string',
				typeOptions: { rows: 6 },
				required: true,
				default: '',
				placeholder: 'Du er en hjelpsom kundeservice-agent...',
				description: 'System prompt for the agent',
				displayOptions: {
					show: { resource: ['agent'], operation: ['create'] },
				},
				routing: {
					send: { type: 'body', property: 'instructions' },
				},
			},
			{
				displayName: 'Additional Agent Options',
				name: 'agentOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: { resource: ['agent'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'description' },
						},
					},
					{
						displayName: 'Voice',
						name: 'voice',
						type: 'options',
						options: [
							{ name: 'Marin', value: 'marin' },
							{ name: 'Ash', value: 'ash' },
							{ name: 'Coral', value: 'coral' },
							{ name: 'Sage', value: 'sage' },
							{ name: 'Alloy', value: 'alloy' },
							{ name: 'Echo', value: 'echo' },
						],
						default: 'marin',
						routing: {
							send: { type: 'body', property: 'voice' },
						},
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Norwegian', value: 'no' },
							{ name: 'English', value: 'en' },
							{ name: 'Swedish', value: 'sv' },
							{ name: 'Danish', value: 'da' },
						],
						default: 'no',
						routing: {
							send: { type: 'body', property: 'language' },
						},
					},
					{
						displayName: 'Greeting Message',
						name: 'greetingMessage',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'greeting_message' },
						},
					},
					{
						displayName: 'Recording Enabled',
						name: 'recordingEnabled',
						type: 'boolean',
						default: true,
						routing: {
							send: { type: 'body', property: 'recording_enabled' },
						},
					},
					{
						displayName: 'Transfer Enabled',
						name: 'transferEnabled',
						type: 'boolean',
						default: false,
						routing: {
							send: { type: 'body', property: 'transfer_enabled' },
						},
					},
					{
						displayName: 'Transfer Number',
						name: 'transferNumber',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'transfer_number' },
						},
					},
					{
						displayName: 'Knowledge Base Enabled',
						name: 'knowledgeBaseEnabled',
						type: 'boolean',
						default: false,
						routing: {
							send: { type: 'body', property: 'knowledge_base_enabled' },
						},
					},
				],
			},
		],
	};
}
