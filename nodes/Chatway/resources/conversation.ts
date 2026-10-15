import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, toItems } from '../shared/utils';

const showForConversation = { resource: ['conversation'] };

export const conversationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForConversation },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many conversations',
				description: 'List conversations, open conversations first',
				routing: {
					request: { method: 'GET', url: '/conversations/all' },
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Resolve',
				value: 'resolve',
				action: 'Resolve a conversation',
				description: 'Mark a conversation as resolved',
				routing: {
					request: {
						method: 'POST',
						url: '=/conversations/{{$parameter.conversationId}}/resolve',
						body: { status: 'resolved' },
					},
					output: { postReceive: [toItems] },
				},
			},
		],
		default: 'getAll',
	},
	...paginationProperties({ ...showForConversation, operation: ['getAll'] }, 100),
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...showForConversation, operation: ['resolve'] } },
		description: 'The ID of the conversation to resolve',
	},
	{
		displayName: 'Resolved By Agent Name or ID',
		name: 'agentId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getAgents' },
		required: true,
		default: '',
		displayOptions: { show: { ...showForConversation, operation: ['resolve'] } },
		description:
			'The agent recorded as resolving the conversation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'agent_id' } },
	},
];
