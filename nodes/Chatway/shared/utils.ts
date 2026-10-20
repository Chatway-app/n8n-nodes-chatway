import type {
	IDataObject,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

export const BASE_URL = 'https://developers.chatway.app/api/v1';

type ApiResource = { id?: string; type?: string; attributes?: IDataObject };

/** Chatway returns `{ id, type, attributes }` resources; flatten them into a single object. */
function flatten(resource: ApiResource | IDataObject): IDataObject {
	const { id, type, attributes, ...rest } = resource as ApiResource & IDataObject;

	if (attributes && typeof attributes === 'object') {
		return { id, type, ...attributes, ...rest };
	}

	return resource as IDataObject;
}

/** Turns `{ data: [...] }` or `{ data: {...} }` responses into one n8n item per resource. */
export async function toItems(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = (response.body ?? {}) as IDataObject;
	const data = body.data ?? body;
	const resources = (Array.isArray(data) ? data : [data]) as IDataObject[];

	return resources.map((resource) => ({ json: flatten(resource) }));
}

/** "Return All" + "Limit" parameters for list operations, paginated via `links.next`. */
export function paginationProperties(
	show: { resource: string[]; operation: string[] },
	maxLimit: number,
): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: { show },
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			routing: {
				send: {
					paginate: '={{ $value }}',
					type: 'query',
					property: 'limit',
					value: String(maxLimit),
				},
				operations: {
					pagination: {
						type: 'generic',
						properties: {
							continue: '={{ !!$response.body?.links?.next }}',
							request: {
								url: '={{ $response.body?.links?.next ?? $request.url }}',
							},
						},
					},
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: { show: { ...show, returnAll: [false] } },
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			routing: {
				// Pages are capped at the endpoint's maximum; fetch more pages when the limit is larger.
				send: {
					type: 'query',
					property: 'limit',
					value: `={{ Math.min($value, ${maxLimit}) }}`,
					paginate: `={{ $value > ${maxLimit} }}`,
				},
				output: { maxResults: '={{$value}}' },
			},
		},
	];
}

async function loadOptions(
	this: ILoadOptionsFunctions,
	url: string,
): Promise<INodePropertyOptions[]> {
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'chatwayApi', {
		method: 'GET',
		baseURL: BASE_URL,
		url,
		qs: { limit: 100 },
		json: true,
	})) as { data?: ApiResource[] };

	return (response.data ?? []).map((resource) => {
		const attributes = resource.attributes ?? {};
		const name = String(attributes.name ?? resource.id);
		const email = attributes.email ? ` (${String(attributes.email)})` : '';

		return { name: `${name}${email}`, value: String(resource.id) };
	});
}

export async function getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return await loadOptions.call(this, '/agents');
}

export async function getWidgets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return await loadOptions.call(this, '/widgets');
}
