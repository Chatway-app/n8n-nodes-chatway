import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, toItems } from '../shared/utils';

const showForContact = { resource: ['contact'] };

const contactId: INodeProperties = {
	displayName: 'Contact ID',
	name: 'contactId',
	type: 'string',
	required: true,
	default: '',
	description: 'The ID of the contact',
};

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForContact },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a contact on a widget, optionally with a first message',
				routing: {
					request: { method: 'POST', url: '/contacts/initialize' },
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Get Single',
				value: 'get',
				action: 'Get single contact',
				description: 'Get a single contact',
				routing: {
					request: { method: 'GET', url: '=/contacts/{{$parameter.contactId}}' },
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'List contacts',
				description: 'List or search contacts',
				routing: {
					request: { method: 'GET', url: '/contacts' },
					output: { postReceive: [toItems] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: "Update a contact's name, email, or phone",
				routing: {
					request: { method: 'PUT', url: '=/contacts/{{$parameter.contactId}}' },
					output: { postReceive: [toItems] },
				},
			},
		],
		default: 'getAll',
	},

	// Create
	{
		displayName: 'Widget Name or ID',
		name: 'widgetId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getWidgets' },
		required: true,
		default: '',
		displayOptions: { show: { ...showForContact, operation: ['create'] } },
		description:
			'The widget the contact belongs to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'widgetId' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showForContact, operation: ['create'] } },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'First Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Start a conversation with this message from the contact',
				routing: { send: { type: 'body', property: 'message.content' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'phone' } },
			},
		],
	},

	// Get / Update
	{ ...contactId, displayOptions: { show: { ...showForContact, operation: ['get', 'update'] } } },
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showForContact, operation: ['update'] } },
		description: 'Set at least one field',
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'phone' } },
			},
		],
	},

	// Get Many
	...paginationProperties({ ...showForContact, operation: ['getAll'] }, 100),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showForContact, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Only return contacts matching this search term',
				routing: { send: { type: 'query', property: 'search' } },
			},
		],
	},
];
