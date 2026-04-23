import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';

import { config } from './config.js';
import { getMessage, readInbox } from './imap.js';
import { searchEmail } from './search.js';
import { sendEmail } from './smtp.js';

function buildToolResponse(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }
    ],
    structuredContent: data
  };
}

function buildErrorResponse(error) {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`
      }
    ],
    isError: true
  };
}

function createServer() {
  const server = new McpServer({
    name: 'yahoo-mail-mcp',
    version: '0.1.0'
  });

  server.registerTool(
    'read_inbox',
    {
      title: 'Read Inbox',
      description: 'Read a recent slice of the Yahoo inbox.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10)
      }
    },
    async ({ limit }) => {
      try {
        const messages = await readInbox(limit);
        return buildToolResponse({ messages, count: messages.length });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'get_message',
    {
      title: 'Get Message',
      description: 'Retrieve a single Yahoo message by IMAP UID.',
      inputSchema: {
        id: z.string().min(1)
      }
    },
    async ({ id }) => {
      try {
        const message = await getMessage(id);
        return buildToolResponse(message);
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'search_email',
    {
      title: 'Search Email',
      description: 'Search the recent Yahoo inbox by from, subject, or since date.',
      inputSchema: {
        from: z.string().optional(),
        subject: z.string().optional(),
        since: z.string().optional()
      }
    },
    async ({ from, subject, since }) => {
      try {
        const matches = await searchEmail({ from, subject, since });
        return buildToolResponse({ matches, count: matches.length });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'send_email',
    {
      title: 'Send Email',
      description: 'Send an email from the Yahoo bot identity.',
      inputSchema: {
        to: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1)
      }
    },
    async ({ to, subject, body }) => {
      try {
        const result = await sendEmail(to, subject, body);
        return buildToolResponse(result);
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  return server;
}

export const app = createMcpExpressApp();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'yahoo-mail-mcp',
    version: '0.1.0',
    transport: 'streamable-http',
    hostname: config.hostname,
    publicHttpsPort: config.publicHttpsPort,
    yahooEmail: config.yahooEmail
  });
});

app.post('/mcp', async (req, res) => {
  const server = createServer();

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error('[mcp] request failure', error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'GET is not enabled in this starter scaffold. Use POST for Streamable HTTP requests.'
  });
});

app.delete('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'DELETE is not enabled in this starter scaffold.'
  });
});

export { config };
