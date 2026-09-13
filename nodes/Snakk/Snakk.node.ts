import { NodeConnectionTypes } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Snakk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Snakk.ai',
		name: 'snakk',
		icon: { light: 'file:snakk-wordmark.svg', dark: 'file:snakk-wordmark.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'AI voice agent platform — start calls, manage agents, and more',
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
					{ name: 'Agent', value: 'agent' },
					{ name: 'Call', value: 'call' },
					{ name: 'Phone Number', value: 'phoneNumber' },
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
						name: 'Get Call',
						value: 'get',
						action: 'Get a specific call',
						description:
							'Get details for a specific call including transcript and status',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/calls/{{$parameter.callId}}',
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
					{
						name: 'Start Call (Existing Agent)',
						value: 'startExisting',
						action: 'Start an outbound call using an existing agent',
						description:
							'Call a number using a pre-configured agent from your dashboard',
						routing: {
							request: {
								method: 'POST',
								url: '/api/calls/outbound',
							},
						},
					},
					{
						name: 'Start Dynamic Call',
						value: 'startDynamic',
						action: 'Start an outbound call with ad hoc agent config',
						description: 'Call a number with a custom agent built on-the-fly',
						routing: {
							request: {
								method: 'POST',
								url: '/api/calls/outbound-dynamic',
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
				description:
					'System prompt / instructions for the AI agent. Supports {{variables}} from Dynamic Variables.',
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
						displayName: 'From Number',
						name: 'fromNumber',
						type: 'string',
						default: '',
						placeholder: '+4787654321',
						description:
							'Specific number to call from (must be assigned to your account)',
						routing: {
							send: { type: 'body', property: 'fromNumber' },
						},
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Danish', value: 'da' },
							{ name: 'English', value: 'en' },
							{ name: 'Norwegian', value: 'no' },
							{ name: 'Swedish', value: 'sv' },
						],
						default: 'no',
						routing: {
							send: { type: 'body', property: 'agentConfig.language' },
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
						displayName: 'Structured Output Enabled',
						name: 'structuredOutputEnabled',
						type: 'boolean',
						default: false,
						description: 'Whether to extract structured data from the call',
						routing: {
							send: {
								type: 'body',
								property: 'agentConfig.structured_output_enabled',
							},
						},
					},
					{
						displayName: 'Structured Output Prompt',
						name: 'structuredOutputPrompt',
						type: 'string',
						default: '',
						routing: {
							send: {
								type: 'body',
								property: 'agentConfig.structured_output_prompt',
							},
						},
					},
					{
						displayName: 'Structured Output Schema (JSON)',
						name: 'structuredOutputSchema',
						type: 'json',
						default: '',
						description: 'JSON Schema defining what data to extract',
						routing: {
							send: {
								type: 'body',
								property: 'agentConfig.structured_output_schema',
							},
						},
					},
					{
						displayName: 'Structured Output Webhook',
						name: 'structuredOutputWebhook',
						type: 'string',
						default: '',
						placeholder: 'https://your-app.com/api/webhook',
						routing: {
							send: {
								type: 'body',
								property: 'agentConfig.structured_output_webhook',
							},
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
						displayName: 'Voice',
						name: 'voice',
						type: 'options',
						options: [
							{ name: 'Alloy', value: 'alloy' },
							{ name: 'Ash', value: 'ash' },
							{ name: 'Coral', value: 'coral' },
							{ name: 'Echo', value: 'echo' },
							{ name: 'Marin', value: 'marin' },
							{ name: 'Sage', value: 'sage' },
						],
						default: 'marin',
						routing: {
							send: { type: 'body', property: 'agentConfig.voice' },
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
				description:
					'Custom variables for template personalization in instructions/greeting. Use {{variableName}} in prompts.',
				displayOptions: {
					show: { resource: ['call'], operation: ['startDynamic'] },
				},
				routing: {
					send: { type: 'body', property: 'dynamicVariables' },
				},
			},

			// ── Get Call fields ───────────────────────────────────────
			{
				displayName: 'Call ID',
				name: 'callId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'call-uuid-here',
				description: 'UUID of the call to retrieve',
				displayOptions: {
					show: { resource: ['call'], operation: ['get'] },
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
				displayName: 'Existing Agent Call Options',
				name: 'existingCallOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: { resource: ['call'], operation: ['startExisting'] },
				},
				options: [
					{
						displayName: 'Dynamic Variables (JSON)',
						name: 'dynamicVariables',
						type: 'json',
						default: '',
						placeholder: '{"name": "Kari"}',
						description:
							"Custom variables for template personalization in the agent's prompts",
						routing: {
							send: { type: 'body', property: 'dynamicVariables' },
						},
					},
					{
						displayName: 'From Number',
						name: 'fromNumber',
						type: 'string',
						default: '',
						placeholder: '+4787654321',
						description:
							"Specific number to call from (must be assigned to your account). If not set, uses the agent's assigned number.",
						routing: {
							send: { type: 'body', property: 'fromNumber' },
						},
					},
				],
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
					{
						name: 'Delete Agent',
						value: 'delete',
						action: 'Delete an agent',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/agents/{{$parameter.agentIdOp}}',
							},
						},
					},
					{
						name: 'Duplicate Agent',
						value: 'duplicate',
						action: 'Duplicate an existing agent',
						description:
							'Create a copy of an existing agent with all its settings',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/agents/{{$parameter.agentIdOp}}/duplicate',
							},
						},
					},
					{
						name: 'Get Agent',
						value: 'get',
						action: 'Get a specific agent',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/agents/{{$parameter.agentIdOp}}',
							},
						},
					},
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
						name: 'Update Agent',
						value: 'update',
						action: 'Update an existing agent',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/api/agents/{{$parameter.agentIdOp}}',
							},
						},
					},
				],
				default: 'list',
			},

			// ── Agent ID field (for get, update, delete) ────────────
			{
				displayName: 'Agent ID',
				name: 'agentIdOp',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'agent-uuid-here',
				description: 'UUID of the agent',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['get', 'update', 'delete', 'duplicate'],
					},
				},
			},

			// ── Update Agent fields ──────────────────────────────────
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['agent'], operation: ['update'] },
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
						displayName: 'Greeting Message',
						name: 'greetingMessage',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'greeting_message' },
						},
					},
					{
						displayName: 'Instructions',
						name: 'instructions',
						type: 'string',
						typeOptions: { rows: 6 },
						default: '',
						routing: {
							send: { type: 'body', property: 'instructions' },
						},
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Danish', value: 'da' },
							{ name: 'English', value: 'en' },
							{ name: 'Norwegian', value: 'no' },
							{ name: 'Swedish', value: 'sv' },
						],
						default: 'no',
						routing: {
							send: { type: 'body', property: 'language' },
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'name' },
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
						displayName: 'Voice',
						name: 'voice',
						type: 'options',
						options: [
							{ name: 'Alloy', value: 'alloy' },
							{ name: 'Ash', value: 'ash' },
							{ name: 'Coral', value: 'coral' },
							{ name: 'Echo', value: 'echo' },
							{ name: 'Marin', value: 'marin' },
							{ name: 'Sage', value: 'sage' },
						],
						default: 'marin',
						routing: {
							send: { type: 'body', property: 'voice' },
						},
					},
				],
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
						displayName: 'Greeting Message',
						name: 'greetingMessage',
						type: 'string',
						default: '',
						routing: {
							send: { type: 'body', property: 'greeting_message' },
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
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						options: [
							{ name: 'Danish', value: 'da' },
							{ name: 'English', value: 'en' },
							{ name: 'Norwegian', value: 'no' },
							{ name: 'Swedish', value: 'sv' },
						],
						default: 'no',
						routing: {
							send: { type: 'body', property: 'language' },
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
						displayName: 'Voice',
						name: 'voice',
						type: 'options',
						options: [
							{ name: 'Alloy', value: 'alloy' },
							{ name: 'Ash', value: 'ash' },
							{ name: 'Coral', value: 'coral' },
							{ name: 'Echo', value: 'echo' },
							{ name: 'Marin', value: 'marin' },
							{ name: 'Sage', value: 'sage' },
						],
						default: 'marin',
						routing: {
							send: { type: 'body', property: 'voice' },
						},
					},
				],
			},

			// ══════════════════════════════════════════════════════════
			//  PHONE NUMBER operations
			// ══════════════════════════════════════════════════════════
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['phoneNumber'] } },
				options: [
					{
						name: 'Assign to Agent',
						value: 'assign',
						action: 'Assign number to agent',
						description:
							'Assign a phone number to a specific agent for inbound calls',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/phone-numbers/{{$parameter.phoneNumberId}}/assign',
							},
						},
					},
					{
						name: 'Claim Number',
						value: 'claim',
						action: 'Claim a number from pool',
						description: 'Claim an available phone number for your account',
						routing: {
							request: {
								method: 'POST',
								url: '/api/phone-numbers/claim-from-pool',
							},
						},
					},
					{
						name: 'List Available Numbers',
						value: 'listAvailable',
						action: 'List available numbers to claim',
						description: 'See which phone numbers are available in the pool',
						routing: {
							request: {
								method: 'GET',
								url: '/api/phone-numbers/pool',
							},
						},
					},
					{
						name: 'List My Numbers',
						value: 'list',
						action: 'List your phone numbers',
						description: 'Get all phone numbers assigned to your account',
						routing: {
							request: {
								method: 'GET',
								url: '/api/phone-numbers',
							},
						},
					},
					{
						name: 'Release Number',
						value: 'release',
						action: 'Release number back to pool',
						description: 'Release a phone number back to the available pool',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/phone-numbers/{{$parameter.phoneNumberId}}',
							},
						},
					},
					{
						name: 'Unassign From Agent',
						value: 'unassign',
						action: 'Unassign number from agent',
						description: 'Remove the agent assignment from a phone number',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/phone-numbers/{{$parameter.phoneNumberId}}/unassign',
							},
						},
					},
				],
				default: 'list',
			},

			// ── Phone Number fields ──────────────────────────────────
			{
				displayName: 'Phone Number ID',
				name: 'phoneNumberId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. 497f6eca-6276-4993-bfeb-53cbbbba6f08',
				description:
					'The number record ID from List My Numbers or List Available Numbers',
				displayOptions: {
					show: {
						resource: ['phoneNumber'],
						operation: ['assign', 'unassign', 'release'],
					},
				},
			},
			{
				displayName: 'Phone Number ID',
				name: 'phoneNumberId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. 497f6eca-6276-4993-bfeb-53cbbbba6f08',
				description:
					'The number record ID from List My Numbers or List Available Numbers',
				displayOptions: {
					show: { resource: ['phoneNumber'], operation: ['claim'] },
				},
				routing: {
					send: { type: 'body', property: 'phoneNumberId' },
				},
			},
			{
				displayName: 'Agent ID',
				name: 'phoneAgentId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'agent-uuid-here',
				description: 'UUID of the agent to receive inbound calls',
				displayOptions: {
					show: { resource: ['phoneNumber'], operation: ['assign'] },
				},
				routing: {
					send: { type: 'body', property: 'agentId' },
				},
			},
		],
	};
}
