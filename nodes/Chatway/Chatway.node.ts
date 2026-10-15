import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { agentDescription } from './resources/agent';
import { contactDescription } from './resources/contact';
import { conversationDescription } from './resources/conversation';
import { messageDescription } from './resources/message';
import { widgetDescription } from './resources/widget';
import { BASE_URL, getAgents, getWidgets } from './shared/utils';

export class Chatway implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chatway Live Chat',
		name: 'chatway',
		icon: { light: 'file:../../icons/chatway.svg', dark: 'file:../../icons/chatway.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage Chatway live chat conversations, messages, and contacts',
		defaults: {
			name: 'Chatway Live Chat',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'chatwayApi', required: true }],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Agent', value: 'agent' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Message', value: 'message' },
					{ name: 'Widget', value: 'widget' },
				],
				default: 'message',
			},
			...agentDescription,
			...contactDescription,
			...conversationDescription,
			...messageDescription,
			...widgetDescription,
		],
	};

	methods = {
		loadOptions: {
			getAgents,
			getWidgets,
		},
	};
}
