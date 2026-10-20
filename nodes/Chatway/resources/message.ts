import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, toItems } from '../shared/utils';

const showForMessage = { resource: ['message'] };

export const messageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForMessage },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'List messages',
				description: 'List the messages in a conversation, newest first',
				routing: {
					request: {
						method: 'GET',
						url: '=/conversations/{{$parameter.conversationId}}/messages',
					},
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Send',
				value: 'send',
				action: 'Send a message',
				description: 'Send a reply to the customer, or add a private note',
				routing: {
					request: { method: 'POST', url: '/messages' },
					output: { postReceive: [toItems] },
				},
			},
		],
		default: 'send',
	},
	// Get Many takes the conversation ID in the URL, Send takes it in the body.
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...showForMessage, operation: ['getAll'] } },
		description: 'The ID of the conversation',
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...showForMessage, operation: ['send'] } },
		description: 'The ID of the conversation to send the message to',
		routing: { send: { type: 'body', property: 'conversation_id' } },
	},

	// Send
	{
		displayName: 'Message Type',
		name: 'type',
		type: 'options',
		options: [
			{
				name: 'Reply',
				value: 'message',
				description: 'Visible to the customer',
			},
			{
				name: 'Private Note',
				value: 'note',
				description: 'Only visible to your team',
			},
		],
		default: 'message',
		displayOptions: { show: { ...showForMessage, operation: ['send'] } },
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: { show: { ...showForMessage, operation: ['send'] } },
		description: 'The text of the message',
		routing: { send: { type: 'body', property: 'content' } },
	},
	{
		// Without agent_id the message is saved as sent by the visitor.
		displayName: 'Send As Agent Name or ID',
		name: 'agentId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getAgents' },
		required: true,
		default: '',
		displayOptions: { show: { ...showForMessage, operation: ['send'] } },
		description:
			'The agent the message is sent as. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'agent_id' } },
	},

	// Get Many (the API returns at most 20 messages per page)
	...paginationProperties({ ...showForMessage, operation: ['getAll'] }, 20),
];
