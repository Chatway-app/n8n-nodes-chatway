# Chatway Live Chat for n8n

[![npm version](https://img.shields.io/npm/v/n8n-nodes-chatway.svg)](https://www.npmjs.com/package/n8n-nodes-chatway)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

Connect **[Chatway Live Chat](https://chatway.app)** with n8n to automate customer support, manage conversations, sync contacts, and build AI-powered customer service workflows.

Chatway is a customer support platform that brings **website live chat, WhatsApp, Instagram, Facebook Messenger, and email** into one shared inbox.

This community node lets you connect Chatway with n8n AI Agents, CRMs, Slack, Google Sheets, and many other apps.

**Get started for free.** Chatway API access and webhooks are available on every plan, including the Free plan.

This package includes two nodes:

* **Chatway Live Chat:** Manage conversations, messages, contacts, agents, and widgets.
* **Chatway Trigger:** Start workflows automatically when events happen in Chatway, such as new conversations, incoming messages, or contact updates.

The Chatway Live Chat node can also be used as a tool by **n8n AI Agents**.

[Chatway Website](https://chatway.app) | [API Documentation](https://developers.chatway.app) | [GitHub Repository](https://github.com/Chatway-app/n8n-nodes-chatway)

## What you can automate

* **AI-powered customer support:** Automatically generate and send customer replies using n8n AI Agents.
* **AI reply suggestions:** Generate draft responses as private notes for your support agents to review.
* **CRM integrations:** Sync Chatway contacts with your CRM or Google Sheets.
* **Slack notifications:** Alert your team when conversations start, messages arrive, or conversations are resolved.
* **Conversation management:** Send replies, add private notes, and resolve conversations automatically.
* **Contact management:** Create, retrieve, search, and update contacts.
* **Custom workflows:** Connect Chatway to other apps and services using n8n.

## Installation

Follow the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

1. Open n8n.
2. Go to **Settings → Community Nodes → Install**.
3. Enter the package name: `n8n-nodes-chatway`
4. Complete the installation.
5. Add a Chatway Live Chat or Chatway Trigger node to your workflow.

## Credentials

Chatway API access and webhooks are available on all plans, including Free. Only workspace owners and admins can create API keys.

1. Log in to [Chatway](https://go.chatway.app).
2. Go to **Settings → Developer Tools → API Keys**.
3. Create a new API key.
4. In n8n, create a new **Chatway API** credential.
5. Paste your API key and save.

n8n automatically tests your credentials.

The API key is sent using the `X-API-KEY` header and is not included in node output.

## Supported operations

### Conversation

| Operation | Description                      |
| --------- | -------------------------------- |
| Get Many  | Retrieve conversations           |
| Resolve   | Resolve an existing conversation |

### Message

| Operation | Description                           |
| --------- | ------------------------------------- |
| Get Many  | Retrieve messages from a conversation |
| Send      | Send a visitor reply or private note  |

### Contact

| Operation | Description                |
| --------- | -------------------------- |
| Create    | Create a new contact       |
| Get       | Retrieve a contact         |
| Get Many  | List and search contacts   |
| Update    | Update contact information |

### Agent

| Operation | Description                     |
| --------- | ------------------------------- |
| Get       | Retrieve an agent               |
| Get Many  | List agents and filter by email |

### Widget

| Operation | Description      |
| --------- | ---------------- |
| Get Many  | Retrieve widgets |

**Additional notes:**

* Sending a message requires selecting an agent.
* Choose **Reply** to send a message to the visitor.
* Choose **Private Note** to leave an internal message visible to your support team.
* Creating a contact requires selecting a widget. You can optionally add a first message to start a conversation.
* All Get Many operations support pagination and Return All.
* To access a conversation, use Get Many or the Chatway Trigger event payload. A dedicated Get Conversation operation is not currently available.

## Chatway Trigger

The Chatway Trigger starts n8n workflows automatically when an event occurs in Chatway.

Select one or more events and activate your workflow. The node automatically registers the webhook in Chatway and removes it when the workflow is deactivated.

### Supported events

| Event                    | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `conversation.created`   | A new conversation starts                           |
| `message.received`       | A visitor sends a message                           |
| `message.sent`           | An agent sends a message                            |
| `message.updated`        | A message is edited                                 |
| `conversation.resolved`  | A conversation is resolved                          |
| `agent.assigned`         | An agent is assigned to a conversation              |
| `contact.created`        | A contact is created                                |
| `contact.updated`        | Contact information changes                         |
| `contact.form.submitted` | A visitor submits a contact or offline form         |
| `tag.assigned`           | A tag is added to a conversation or contact         |
| `tag.removed`            | A tag is removed from a conversation or contact     |
| `custom.data.assigned`   | Custom data is added to a conversation or contact   |
| `custom.data.removed`    | Custom data is removed from a conversation or contact |
| `automation.triggered`   | An automation rule runs                             |

### Example webhook payload

```json
{
  "id": "evt_8f2c...",
  "event": "message.received",
  "occurred_at": "2026-02-04T10:31:12Z",
  "data": {
    "message": {
      "id": "...",
      "content": "Hello, I need help"
    },
    "conversation": {
      "id": "...",
      "channel": "website",
      "status": "open"
    },
    "visitor": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Webhook requirements

* Your n8n instance must be reachable over HTTPS on a public domain name. Chatway does not deliver webhooks to localhost, IP addresses, or plain HTTP.
* Webhook deliveries are signed. The trigger checks the signature and timestamp and rejects anything that doesn't match.
* If n8n doesn't respond within a few seconds, Chatway retries the delivery. The trigger ignores repeated deliveries of the same event, so each event runs the workflow once.
* A Chatway team can have up to 10 webhooks. Each active Chatway Trigger workflow uses one.

## Workflow examples

### 1. Automatically reply to customers using AI

Use an n8n AI Agent to generate and send customer support replies through Chatway.

**Workflow:**

`Chatway Trigger (message.received) → AI Agent → Chatway Live Chat (Message → Send → Reply)`

When a visitor sends a message, the workflow passes the message to an AI agent. The AI agent generates a response, which is sent back to the visitor through Chatway.

`message.received` only fires for visitor messages, so the reply sent by the workflow does not trigger it again.

You can connect the AI agent to your own knowledge sources to provide more relevant answers. For production workflows, consider adding human approval or escalation for questions the agent can't answer.

### 2. Generate AI reply suggestions for support agents

Use AI to draft replies without sending them automatically.

**Workflow:**

`Chatway Trigger (message.received) → AI Agent → Chatway Live Chat (Message → Send → Private Note)`

The AI-generated response appears as a private note in the conversation, allowing a human agent to review it before replying.

Useful expressions:

* Conversation ID: `{{ $json.data.conversation.id }}`
* Visitor message: `{{ $json.data.message.content }}`

### 3. Sync new contacts with Google Sheets

Automatically add new Chatway contacts to a spreadsheet.

**Workflow:**

`Chatway Trigger (contact.created) → Google Sheets (Append Row)`

You can also connect Chatway to a CRM or other customer management tools.

### 4. Send Slack notifications for new conversations

Notify your team when a new conversation starts.

**Workflow:**

`Chatway Trigger (conversation.created) → Slack (Send Message)`

Example Slack message:

```text
New chat from {{ $json.data.visitor.name }}
Widget: {{ $json.data.conversation.widget_name }}
```

### 5. Export contacts automatically

Export Chatway contacts to Google Sheets on a schedule.

**Workflow:**

`Schedule Trigger → Chatway Live Chat (Contact → Get Many, Return All) → Google Sheets`

### 6. Resolve conversations from other tools

Automatically resolve Chatway conversations based on actions in other applications.

**Workflow:**

`External App Trigger → Chatway Live Chat (Conversation → Resolve)`

## Use Chatway with n8n AI Agents

The Chatway Live Chat node can be used as a tool by n8n AI Agents.

This allows AI agents to work with Chatway using the supported operations, including retrieving conversations, managing contacts, and sending messages.

Example use cases include:

* AI customer support assistants
* Automated customer follow-ups
* Customer information retrieval
* AI-generated support replies
* Customer service workflow automation

Chatway can serve as the customer communication channel while n8n handles AI processing and workflow automation.

## Compatibility

* Built using the n8n-node CLI
* Uses n8n Nodes API version 1
* Tested with n8n 2.43

## Resources

* [Chatway Website](https://chatway.app)
* [Chatway API Documentation](https://developers.chatway.app)
* [Chatway GitHub Repository](https://github.com/Chatway-app/n8n-nodes-chatway)
* [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE.md)
