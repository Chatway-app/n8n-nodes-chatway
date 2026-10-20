import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { BASE_URL } from '../Chatway/shared/utils';

const SIGNATURE_TOLERANCE_SECONDS = 300;
// Retries reuse the event id. Kept in memory since static data isn't saved from webhook calls.
const RECENT_EVENT_TTL_MS = 24 * 60 * 60 * 1000;
const RECENT_EVENT_IDS_LIMIT = 1000;
const recentEventIds = new Map<string, number>();

function isDuplicateEvent(webhookId: string, eventId: string): boolean {
	const now = Date.now();
	const key = `${webhookId}:${eventId}`;

	for (const [storedKey, seenAt] of recentEventIds) {
		if (now - seenAt > RECENT_EVENT_TTL_MS) {
			recentEventIds.delete(storedKey);
		}
	}

	if (recentEventIds.has(key)) {
		return true;
	}

	recentEventIds.set(key, now);
	if (recentEventIds.size > RECENT_EVENT_IDS_LIMIT) {
		recentEventIds.delete(recentEventIds.keys().next().value as string);
	}

	return false;
}

type WebhookStaticData = IDataObject & {
	webhookId?: string;
	webhookSecret?: string;
};

async function chatwayRequest(
	this: IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	url: string,
	body?: IDataObject,
): Promise<{ statusCode: number; body: IDataObject }> {
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'chatwayApi', {
		method,
		baseURL: BASE_URL,
		url,
		body,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	})) as { statusCode: number; body: IDataObject };

	return response;
}

function sameEvents(a: unknown, b: string[]): boolean {
	if (!Array.isArray(a) || a.length !== b.length) {
		return false;
	}

	return [...a].sort().join(',') === [...b].sort().join(',');
}

function isValidSignature(secret: string, timestamp: string, rawBody: string, signature: string): boolean {
	const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`;

	const expectedBuffer = Buffer.from(expected);
	const signatureBuffer = Buffer.from(signature);

	return (
		expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer)
	);
}

export class ChatwayTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chatway Trigger',
		name: 'chatwayTrigger',
		icon: { light: 'file:../../icons/chatway.svg', dark: 'file:../../icons/chatway.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when events happen in Chatway Live Chat',
		defaults: {
			name: 'Chatway Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'chatwayApi', required: true }],
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
				displayName: 'Event Names or IDs',
				name: 'events',
				type: 'multiOptions',
				typeOptions: { loadOptionsMethod: 'getEvents' },
				required: true,
				default: [],
				description:
					'The Chatway events that start this workflow. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEvents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const { body } = await chatwayRequest.call(this, 'GET', '/webhooks/events');
				const events = (body.data ?? []) as Array<{ value: string; label: string; description?: string }>;

				return events.map((event) => ({
					name: event.label,
					value: event.value,
					description: event.description,
				}));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;

				if (!staticData.webhookId) {
					return false;
				}

				const { statusCode, body } = await chatwayRequest.call(
					this,
					'GET',
					`/webhooks/${staticData.webhookId}`,
				);

				if (statusCode === 404) {
					delete staticData.webhookId;
					delete staticData.webhookSecret;
					return false;
				}

				const attributes = ((body.data as IDataObject | undefined)?.attributes ?? {}) as IDataObject;
				const events = this.getNodeParameter('events') as string[];

				if (
					statusCode === 200 &&
					attributes.endpoint_url === this.getNodeWebhookUrl('default') &&
					sameEvents(attributes.events, events) &&
					staticData.webhookSecret
				) {
					return true;
				}

				// URL or events changed, recreate it.
				await chatwayRequest.call(this, 'DELETE', `/webhooks/${staticData.webhookId}`);
				delete staticData.webhookId;
				delete staticData.webhookSecret;

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				const workflowName = this.getWorkflow().name ?? 'workflow';

				const { statusCode, body } = await chatwayRequest.call(this, 'POST', '/webhooks', {
					// Names are unique per workspace.
					name: `n8n: ${workflowName} (${randomBytes(3).toString('hex')})`.slice(0, 255),
					endpoint_url: this.getNodeWebhookUrl('default'),
					events: this.getNodeParameter('events') as string[],
				});

				if (statusCode !== 201) {
					throw new NodeOperationError(
						this.getNode(),
						`Chatway could not create the webhook: ${String(body.message ?? `HTTP ${statusCode}`)}`,
					);
				}

				const webhook = body.data as IDataObject;
				const attributes = (webhook.attributes ?? {}) as IDataObject;

				staticData.webhookId = String(webhook.id);
				staticData.webhookSecret = String(attributes.secret);

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;

				if (staticData.webhookId) {
					const { statusCode } = await chatwayRequest.call(
						this,
						'DELETE',
						`/webhooks/${staticData.webhookId}`,
					);

					if (statusCode !== 200 && statusCode !== 404) {
						return false;
					}
				}

				delete staticData.webhookId;
				delete staticData.webhookSecret;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
		const request = this.getRequestObject();
		const response = this.getResponseObject();
		const headers = this.getHeaderData() as IDataObject;

		const signature = String(headers['x-chatway-signature'] ?? '');
		const timestamp = String(headers['x-chatway-timestamp'] ?? '');
		const rawBody = request.rawBody?.toString('utf8') ?? '';
		const age = Math.abs(Date.now() / 1000 - Number(timestamp));

		if (
			!staticData.webhookSecret ||
			!signature ||
			!Number.isFinite(age) ||
			age > SIGNATURE_TOLERANCE_SECONDS ||
			!isValidSignature(staticData.webhookSecret, timestamp, rawBody, signature)
		) {
			response.status(401).json({ message: 'Invalid Chatway signature.' });
			return { noWebhookResponse: true };
		}

		const body = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events') as string[];
		const eventId = String(body.id ?? '');

		// Ack unselected events and retries without running.
		if (
			!events.includes(String(body.event)) ||
			(eventId && isDuplicateEvent(String(staticData.webhookId), eventId))
		) {
			response.status(200).json({ received: true });
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
