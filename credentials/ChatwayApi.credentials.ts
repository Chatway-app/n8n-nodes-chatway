import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ChatwayApi implements ICredentialType {
	name = 'chatwayApi';

	displayName = 'Chatway API';

	icon: Icon = { light: 'file:../icons/chatway.svg', dark: 'file:../icons/chatway.dark.svg' };

	documentationUrl = 'https://github.com/Chatway-app/n8n-nodes-chatway?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Create an API key in Chatway under Settings → Developer Tools → API Keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'http://api-docs.chatway.test/api/v1', // TEMP local test — revert
			url: '/widgets',
			qs: { limit: 1 },
		},
	};
}
