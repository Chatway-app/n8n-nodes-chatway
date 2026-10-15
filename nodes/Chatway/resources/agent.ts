import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, toItems } from '../shared/utils';

const showForAgent = { resource: ['agent'] };

export const agentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForAgent },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an agent',
				description: 'Get a single teammate',
				routing: {
					request: { method: 'GET', url: '=/agents/{{$parameter.agentId}}' },
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many agents',
				description: 'List the teammates in your Chatway workspace',
				routing: {
					request: { method: 'GET', url: '/agents' },
					output: { postReceive: [toItems] },
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Agent Name or ID',
		name: 'agentId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getAgents' },
		required: true,
		default: '',
		displayOptions: { show: { ...showForAgent, operation: ['get'] } },
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	...paginationProperties({ ...showForAgent, operation: ['getAll'] }, 100),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showForAgent, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Only return the agent with this email address',
				routing: { send: { type: 'query', property: 'email' } },
			},
		],
	},
];
