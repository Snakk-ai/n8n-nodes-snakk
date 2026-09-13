const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Snakk } = require('../dist/nodes/Snakk/Snakk.node.js');
const { SnakkApi } = require('../dist/credentials/SnakkApi.credentials.js');
const { SnakkTrigger } = require('../dist/nodes/Snakk/SnakkTrigger.node.js');

const node = new Snakk();
const op = (resource, value) =>
	node.description.properties
		.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions.show.resource.includes(resource),
		)
		.options.find((o) => o.value === value);
// Expectations below come from doc.snakk.ai, fetched 2026-09-07.
test('credentials use current service and an authenticated endpoint', () => {
	const c = new SnakkApi();
	assert.equal(
		c.properties.find((p) => p.name === 'baseUrl').default,
		'https://api.snakk.ai',
	);
	assert.equal(
		c.authenticate.properties.headers['X-API-Key'],
		'={{$credentials.apiKey}}',
	);
	assert.equal(c.test.request.url, '/api/tenants/me');
	assert.equal(
		c.properties.find((p) => p.name === 'webhookSecret').typeOptions.password,
		true,
	);
});
test('agent updates use the documented PATCH method', () => {
	assert.equal(op('agent', 'update').routing.request.method, 'PATCH');
});
test('phone operations use record IDs and current routes', () => {
	assert.equal(
		op('phoneNumber', 'listAvailable').routing.request.url,
		'/api/phone-numbers/pool',
	);
	assert.equal(
		op('phoneNumber', 'claim').routing.request.url,
		'/api/phone-numbers/claim-from-pool',
	);
	assert.equal(
		op('phoneNumber', 'assign').routing.request.url,
		'=/api/phone-numbers/{{$parameter.phoneNumberId}}/assign',
	);
	assert.equal(
		op('phoneNumber', 'unassign').routing.request.url,
		'=/api/phone-numbers/{{$parameter.phoneNumberId}}/unassign',
	);
	assert.equal(op('phoneNumber', 'release').routing.request.method, 'DELETE');
	assert.equal(
		op('phoneNumber', 'release').routing.request.url,
		'=/api/phone-numbers/{{$parameter.phoneNumberId}}',
	);
	const ids = node.description.properties.filter(
		(p) => p.name === 'phoneNumberId',
	);
	assert.equal(ids.length, 2);
	assert.equal(
		ids.find((p) => p.displayOptions.show.operation.includes('claim')).routing
			.send.property,
		'phoneNumberId',
	);
	assert.equal(
		ids.find((p) => p.displayOptions.show.operation.includes('assign')).routing,
		undefined,
	);
	assert.deepEqual(
		node.description.properties.find((p) => p.name === 'phoneAgentId')
			.displayOptions.show.operation,
		['assign'],
	);
});
test('existing outbound actions remain available', () => {
	assert.equal(
		op('call', 'startExisting').routing.request.url,
		'/api/calls/outbound',
	);
	assert.equal(
		op('call', 'startDynamic').routing.request.url,
		'/api/calls/outbound-dynamic',
	);
});

const secret = 'synthetic-test-secret-with-over-32-characters';
async function deliver({
	supplied = secret,
	configured = secret,
	event = 'callEnded',
	body = { status: 'completed', call_id: 'synthetic-call' },
} = {}) {
	const replies = [];
	const response = {
		status(code) {
			this.code = code;
			return this;
		},
		json(body) {
			replies.push({ code: this.code, body });
		},
	};
	let processed = 0;
	const output = await new SnakkTrigger().webhook.call({
		getCredentials: async () => ({ webhookSecret: configured }),
		getHeaderData: () =>
			supplied === undefined ? {} : { 'x-snakk-webhook-secret': supplied },
		getResponseObject: () => response,
		getBodyData: () => {
			processed++;
			return body;
		},
		getNodeParameter: () => event,
		helpers: { returnJsonArray: (body) => [{ json: body }] },
	});
	return { replies, output, processed };
}
test('reject incorrect secret before processing or emitting call data', async () => {
	for (const supplied of ['', 'wrong', secret + 'x', [secret]]) {
		const result = await deliver({ supplied });
		assert.equal(result.replies[0].code, 401);
		assert.equal(result.processed, 0);
		assert.equal(result.output.workflowData, undefined);
	}
});
test('reject missing or too-short configured secret', async () => {
	for (const configured of ['', 'short', null])
		assert.equal((await deliver({ configured })).replies[0].code, 401);
});
test('authenticated completed call is acknowledged and emitted', async () => {
	const r = await deliver();
	assert.equal(r.replies[0].code, 200);
	assert.equal(r.output.workflowData[0][0].json.call_id, 'synthetic-call');
});
test('filtered events still receive a success acknowledgement, without starting workflow', async () => {
	for (const args of [
		{ event: 'structuredOutput', body: { status: 'completed' } },
		{ event: 'callEnded', body: { structured_output: { topic: 'demo' } } },
	]) {
		const r = await deliver(args);
		assert.equal(r.replies[0].code, 200);
		assert.equal(r.output.workflowData, undefined);
	}
});
test('structured output and any event modes retain their published payload shape', async () => {
	for (const event of ['structuredOutput', 'any']) {
		const r = await deliver({
			event,
			body: { structured_output: { topic: 'demo' }, status: 'completed' },
		});
		assert.deepEqual(r.output.workflowData[0][0].json.structured_output, {
			topic: 'demo',
		});
	}
});

function hooks({
	webhooks = [],
	stored = {},
	hookUrl = 'https://workflow.example.test/snakk',
	apiSecret = secret,
	failDelete,
	failList,
} = {}) {
	const requests = [];
	const ctx = {
		getCredentials: async () => ({
			apiKey: 'not-a-real-key',
			baseUrl: 'https://api.snakk.ai/',
			webhookSecret: apiSecret,
		}),
		getNodeParameter: () => 'test-agent',
		getNodeWebhookUrl: () => hookUrl,
		getNode: () => ({ name: 'Snakk Trigger', type: 'snakkTrigger' }),
		getWorkflowStaticData: () => stored,
		helpers: {
			httpRequestWithAuthentication: async function (credential, request) {
				assert.equal(credential, 'snakkApi');
				requests.push(request);
				if (request.method === 'GET') {
					if (failList) throw failList;
					return { webhooks };
				}
				if (request.method === 'POST') return { webhook: { id: 'created-id' } };
				if (request.method === 'DELETE' && failDelete) throw failDelete;
				return { success: true };
			},
		},
	};
	return {
		ctx,
		stored,
		requests,
		methods: new SnakkTrigger().webhookMethods.default,
	};
}
test('registers an HTTPS after-call webhook with separate delivery secret', async () => {
	const h = hooks();
	assert.equal(await h.methods.checkExists.call(h.ctx), false);
	await h.methods.create.call(h.ctx);
	const req = h.requests[1];
	assert.equal(req.url, 'https://api.snakk.ai/api/end-of-call-webhooks');
	assert.equal(req.body.agent_id, 'test-agent');
	assert.equal(req.body.body_template, null);
	assert.equal(req.body.headers['X-Snakk-Webhook-Secret'], secret);
	assert.equal(JSON.stringify(req.body).includes('not-a-real-key'), false);
	assert.equal(h.stored.webhookId, 'created-id');
});
test('does not adopt an unrelated webhook', async () => {
	for (const entry of [
		{ agent_id: 'other-agent', name: 'n8n Snakk Trigger' },
		{ agent_id: 'test-agent', name: 'Customer integration' },
	]) {
		const h = hooks({
			webhooks: [
				{
					id: 'other-id',
					url: 'https://workflow.example.test/snakk',
					...entry,
				},
			],
		});
		assert.equal(await h.methods.checkExists.call(h.ctx), false);
		assert.equal(h.stored.webhookId, undefined);
	}
});
test('reuses own existing callback and updates its authentication without duplicates', async () => {
	const h = hooks({
		webhooks: [
			{
				id: 'owned-id',
				agent_id: 'test-agent',
				url: 'https://workflow.example.test/snakk',
				name: 'n8n Snakk Trigger',
				enabled: false,
			},
		],
	});
	assert.equal(await h.methods.checkExists.call(h.ctx), true);
	assert.equal(h.stored.webhookId, 'owned-id');
	assert.deepEqual(
		h.requests.map((r) => r.method),
		['GET', 'PATCH'],
	);
	assert.equal(h.requests[1].body.headers['X-Snakk-Webhook-Secret'], secret);
});
test('activation rejects HTTP callbacks and inadequate secrets', async () => {
	for (const opts of [
		{ hookUrl: 'http://localhost:5678/test' },
		{ apiSecret: 'short' },
	]) {
		const h = hooks(opts);
		await assert.rejects(h.methods.create.call(h.ctx));
		assert.equal(h.requests.length, 0);
	}
});
test('deactivation deletes only the stored callback; repeated cleanup is harmless', async () => {
	const h = hooks({ stored: { webhookId: 'owned-id' } });
	await h.methods.delete.call(h.ctx);
	await h.methods.delete.call(h.ctx);
	assert.deepEqual(
		h.requests.map((r) => [r.method, r.url]),
		[['DELETE', 'https://api.snakk.ai/api/end-of-call-webhooks/owned-id']],
	);
	assert.equal(h.stored.webhookId, undefined);
});
test('already deleted callbacks clear local state; real API failures retain it', async () => {
	const missing = hooks({
		stored: { webhookId: 'owned-id' },
		failDelete: { statusCode: 404 },
	});
	await missing.methods.delete.call(missing.ctx);
	assert.equal(missing.stored.webhookId, undefined);
	const failed = hooks({
		stored: { webhookId: 'owned-id' },
		failDelete: new Error('Service unavailable'),
	});
	await assert.rejects(failed.methods.delete.call(failed.ctx));
	assert.equal(failed.stored.webhookId, 'owned-id');
	const list = hooks({ failList: new Error('Unauthorized') });
	await assert.rejects(list.methods.checkExists.call(list.ctx));
	assert.equal(list.requests.length, 1);
});

// Current dispatch-end-of-call uses structured_data and omits status.
test('current after-call dispatcher fixture works in both event modes without a status field', async () => {
 const body = { call_id: 'synthetic-call', summary: 'Synthetic support request', structured_data: { topic: 'support' }, duration_seconds: 42 };
 for (const event of ['callEnded', 'structuredOutput']) {
  const r = await deliver({event, body});
  assert.equal(r.replies[0].code, 200);
  assert.deepEqual(r.output.workflowData[0][0].json, body);
 }
});
