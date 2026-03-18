import { NodeConnectionTypes } from 'n8n-workflow';
import type {
	IDataObject,
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class SnakkTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Snakk.ai Trigger',
		name: 'snakkTrigger',
		icon: 'file:snakk.png',
		group: ['trigger'],
		version: 1,
		subtitle: '=on {{$parameter["event"]}}',
		description: 'Triggers when a Snakk.ai call event occurs (end of call, structured output)',
		defaults: {
			name: 'Snakk.ai Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'snakkApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
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
						description: 'Triggers when structured data is extracted from a call',
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
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const event = this.getNodeParameter('event') as string;

		if (event === 'callEnded') {
			if (body.structured_output && !body.status) {
				return { noWebhookResponse: true };
			}
		} else if (event === 'structuredOutput') {
			if (!body.structured_output) {
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
