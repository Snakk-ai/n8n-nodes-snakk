import {
	NodeConnectionTypes,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';
import { createHash, timingSafeEqual } from 'node:crypto';
import type {
	IDataObject,
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';

export class SnakkTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Snakk.ai Trigger',
		name: 'snakkTrigger',
		icon: { light: 'file:snakk-wordmark.svg', dark: 'file:snakk-wordmark.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '=on {{$parameter["event"]}}',
		description:
			'Triggers when a Snakk.ai call event occurs (end of call, structured output)',
		defaults: {
			name: 'Snakk.ai Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'snakkApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'responseNode',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Activation registers an authenticated end-of-call webhook on this agent. Set a Webhook Secret in your credential first. For live lookups during a call, use the Webhook and Respond to Webhook nodes instead.',
				name: 'webhookSetup',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				default: '',
				required: true,
				description:
					'The Snakk agent whose completed calls should start this workflow',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Call Ended',
						value: 'callEnded',
						description: 'Triggers when a call ends (end_call_webhook)',
					},
					{
						name: 'Structured Output Ready',
						value: 'structuredOutput',
						description:
							'Triggers when structured data is extracted from a call',
					},
					{
						name: 'Any Event',
						value: 'any',
						description: 'Triggers on any webhook event from Snakk.ai',
					},
				],
				default: 'callEnded',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('snakkApi');
				const secret = credentials.webhookSecret;
				if (typeof secret !== 'string' || secret.length < 32) {
					throw new NodeOperationError(
						this.getNode(),
						'Set a Webhook Secret of at least 32 characters in the Snakk credential',
					);
				}
				const agentId = this.getNodeParameter('agentId') as string;
				const result = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'snakkApi',
					{
						method: 'GET',
						url: `${String(credentials.baseUrl).replace(/\/$/, '')}/api/end-of-call-webhooks`,
						qs: { agent_id: agentId },
						json: true,
					},
				)) as {
					webhooks: Array<{
						id: string;
						agent_id: string;
						url: string;
						name: string;
						enabled: boolean;
						headers?: Record<string, string>;
					}>;
				};
				const saved = this.getWorkflowStaticData('node');
				const match = result.webhooks.find(
					(hook) =>
						hook.agent_id === agentId &&
						hook.url === this.getNodeWebhookUrl('default') &&
						hook.name === 'n8n Snakk Trigger',
				);
				if (!match) return false;
				saved.webhookId = match.id;
				if (
					!match.enabled ||
					match.headers?.['X-Snakk-Webhook-Secret'] !== secret
				) {
					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'snakkApi',
						{
							method: 'PATCH',
							url: `${String(credentials.baseUrl).replace(/\/$/, '')}/api/end-of-call-webhooks/${encodeURIComponent(match.id)}`,
							body: {
								enabled: true,
								headers: { 'X-Snakk-Webhook-Secret': secret },
							},
							json: true,
						},
					);
				}
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('snakkApi');
				const secret = credentials.webhookSecret;
				if (typeof secret !== 'string' || secret.length < 32) {
					throw new NodeOperationError(
						this.getNode(),
						'Set a Webhook Secret of at least 32 characters in the Snakk credential',
					);
				}
				const url = this.getNodeWebhookUrl('default');
				if (!url?.startsWith('https://')) {
					throw new NodeOperationError(
						this.getNode(),
						'Snakk requires a publicly reachable HTTPS webhook URL',
					);
				}
				const result = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'snakkApi',
					{
						method: 'POST',
						url: `${String(credentials.baseUrl).replace(/\/$/, '')}/api/end-of-call-webhooks`,
						body: {
							agent_id: this.getNodeParameter('agentId'),
							name: 'n8n Snakk Trigger',
							url,
							method: 'POST',
							headers: { 'X-Snakk-Webhook-Secret': secret },
							body_template: null,
							enabled: true,
						},
						json: true,
					},
				)) as { webhook: { id: string } };
				if (!result.webhook?.id) {
					throw new NodeOperationError(
						this.getNode(),
						'Snakk did not return the registered webhook ID',
					);
				}
				this.getWorkflowStaticData('node').webhookId = result.webhook.id;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const saved = this.getWorkflowStaticData('node');
				if (typeof saved.webhookId !== 'string') return true;
				const credentials = await this.getCredentials('snakkApi');
				try {
					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'snakkApi',
						{
							method: 'DELETE',
							url: `${String(credentials.baseUrl).replace(/\/$/, '')}/api/end-of-call-webhooks/${encodeURIComponent(saved.webhookId)}`,
							json: true,
						},
					);
				} catch (error) {
					const status =
						(error as { statusCode?: number; response?: { status?: number } })
							.statusCode ??
						(error as { response?: { status?: number } }).response?.status;
					if (status !== 404)
						throw new NodeApiError(this.getNode(), error as JsonObject);
				}
				delete saved.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const credentials = await this.getCredentials('snakkApi');
		const secret = credentials.webhookSecret;
		const provided = this.getHeaderData()['x-snakk-webhook-secret'];
		const response = this.getResponseObject();
		if (
			typeof secret !== 'string' ||
			secret.length < 32 ||
			typeof provided !== 'string' ||
			!timingSafeEqual(
				createHash('sha256').update(secret).digest(),
				createHash('sha256').update(provided).digest(),
			)
		) {
			response.status(401).json({ error: 'Unauthorized' });
			return { noWebhookResponse: true };
		}
		const body = this.getBodyData();
		const event = this.getNodeParameter('event') as string;
		response.status(200).json({ received: true });

		if (event === 'callEnded') {
			if (body.structured_output && !body.status) {
				return { noWebhookResponse: true };
			}
		} else if (event === 'structuredOutput') {
			if (!body.structured_output && !body.structured_data) {
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
