import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, toItems } from '../shared/utils';

const showForWidget = { resource: ['widget'] };

export const widgetDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForWidget },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many widgets',
				description: 'List the chat widgets in your Chatway workspace',
				routing: {
					request: { method: 'GET', url: '/widgets' },
					output: { postReceive: [toItems] },
				},
			},
		],
		default: 'getAll',
	},
	...paginationProperties({ ...showForWidget, operation: ['getAll'] }, 100),
];
