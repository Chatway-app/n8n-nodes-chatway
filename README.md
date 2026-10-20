# Chatway Live Chat for n8n

Automate customer support conversations, messages and contacts with [Chatway](https://chatway.app) and [n8n](https://n8n.io).

Chatway is a live chat and customer support platform that brings website chat, WhatsApp, Instagram, Facebook Messenger and email into one shared inbox. This package adds two nodes to n8n:

- **Chatway Live Chat**: work with conversations, messages, contacts, agents and widgets.
- **Chatway Trigger**: start a workflow the moment something happens in Chatway, such as a new conversation or an incoming message.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Trigger](#trigger) · [Examples](#examples) · [Compatibility](#compatibility) · [Resources](#resources)

## What you can automate

- Draft or send replies with an n8n AI Agent when a visitor writes in
- Add new contacts to a CRM or Google Sheets
- Alert your team in Slack when a conversation starts or is resolved
- Leave private notes on conversations for your agents
- Resolve conversations from other tools

The Chatway Live Chat node can also be used as a tool by n8n AI Agents.

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/). In n8n, go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-chatway
```

## Credentials

1. In Chatway, go to **Settings → Developer Tools → API Keys** and create a key.
2. In n8n, create a new **Chatway API** credential and paste the key.
3. Save. n8n tests the key right away.

The key is sent in the `X-API-KEY` header and never appears in node output.

## Operations

| Resource | Operations |
|---|---|
| Conversation | Get Many, Resolve |
| Message | Get Many (in a conversation), Send (reply or private note) |
| Contact | Create, Get, Get Many (with search), Update |
| Agent | Get, Get Many (filter by email) |
| Widget | Get Many |

Notes:

- **Send** always sends as an agent you pick. Choose **Reply** to message the visitor, or **Private Note** for something only your team sees.
- **Create** contact needs a widget. Add a **First Message** to start a conversation for that contact.
- All **Get Many** operations support **Return All** and follow pagination automatically.
- The Chatway API doesn't have an endpoint to fetch a single conversation, so there is no "Get Conversation" operation. Use **Get Many** or the trigger's payload instead.

## Trigger

Pick one or more events and activate the workflow. The node registers the webhook in Chatway for you and removes it when the workflow is deactivated.

Available events:

| Event | Fires when |
|---|---|
| `conversation.created` | A new conversation starts |
| `message.received` | A visitor sends a message |
| `message.sent` | An agent sends a message |
| `message.updated` | A message is edited |
| `conversation.resolved` | A conversation is resolved by an agent, automation or the system |
| `agent.assigned` | An agent is assigned to a conversation |
| `contact.created` | A new contact is added or identified |
| `contact.updated` | A contact's details change |
| `contact.form.submitted` | A visitor submits a contact or offline form |
| `tag.assigned` / `tag.removed` | A tag is added to or removed from a conversation or contact |
| `custom.data.assigned` / `custom.data.removed` | Custom data is added to or removed from a conversation or contact |
| `automation.triggered` | An automation rule runs |

Every delivery looks like this, with the event details under `data`:

```json
{
  "id": "evt_8f2c...",
  "event": "message.received",
  "occurred_at": "2026-02-04T10:31:12Z",
  "data": {
    "message": { "id": "...", "content": "Hello, I need help" },
    "conversation": { "id": "...", "channel": "website", "status": "open" },
    "visitor": { "id": "...", "name": "John Doe", "email": "john@example.com" }
  }
}
```

Good to know:

- Your n8n instance must be reachable from the internet over **HTTPS**. Chatway doesn't deliver to `localhost` or plain HTTP.
- Each delivery is signed. The trigger checks the signature and timestamp and rejects anything that doesn't match.
- Chatway retries a delivery if n8n doesn't answer in time. The trigger ignores repeats of the same event, so a workflow runs once per event.
- A Chatway team can have up to 10 webhooks. Each active workflow with a Chatway Trigger uses one.

## Examples

**Reply suggestions with AI**

Chatway Trigger (`message.received`) → AI Agent → Chatway Live Chat (Message → Send, **Private Note**)

The draft lands as a private note, so an agent can review it before replying. Use these fields from the trigger:

- Conversation ID: `{{ $json.data.conversation.id }}`
- Visitor message: `{{ $json.data.message.content }}`

**New contacts to Google Sheets**

Chatway Trigger (`contact.created`) → Google Sheets (Append Row)

**Slack alert for new conversations**

Chatway Trigger (`conversation.created`) → Slack (Send Message)

```
New chat from {{ $json.data.visitor.name }} on {{ $json.data.conversation.widget_name }}
```

**Daily export of contacts**

Schedule Trigger → Chatway Live Chat (Contact → Get Many, Return All) → Google Sheets

## Compatibility

Built with the `n8n-node` CLI using n8n Nodes API version 1. Tested with n8n 2.43.

## Resources

- [Chatway](https://chatway.app)
- [Chatway API documentation](https://developers.chatway.app)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE.md)
