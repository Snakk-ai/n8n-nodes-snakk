import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SnakkApi implements ICredentialType {
	icon = { light: 'file:../nodes/Snakk/snakk-wordmark.svg', dark: 'file:../nodes/Snakk/snakk-wordmark.dark.svg' } as const;
	name = 'snakkApi';
	displayName = 'Snakk.ai API';
	documentationUrl = 'https://doc.snakk.ai/';
	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Required only for the trigger: a dedicated random secret of at least 32 characters, shared with Snakk for authenticating webhook deliveries. Do not reuse your API key.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Snakk.ai API key from the dashboard',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.snakk.ai',
			description: 'Snakk.ai API base URL',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/tenants/me',
		},
	};
}
