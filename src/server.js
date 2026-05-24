import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';

import { config } from './config.js';
import { createMailProvider } from './providers/index.js';

const mailProvider = createMailProvider();

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
  console.error('[mcp] tool failure', error);

  return {
    content: [
      {
        type: 'text',
        text: 'Error: request failed'
      }
    ],
    isError: true
  };
}

function requireBearerToken(req, res, next) {
  if (!config.mcpBearerToken) {
    res.status(500).json({ error: 'MCP auth is not configured' });
    return;
  }

  const actual = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!actual || actual !== config.mcpBearerToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
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
      description: 'Read a recent slice of the configured inbox provider.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10)
      }
    },
    async ({ limit }) => {
      try {
        const messages = await mailProvider.readInbox(limit);
        return buildToolResponse({ provider: mailProvider.name, messages, count: messages.length });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'get_message',
    {
      title: 'Get Message',
      description: 'Retrieve a single message by provider-specific id.',
      inputSchema: {
        id: z.string().min(1).max(128),
        includeRaw: z.boolean().default(false)
      }
    },
    async ({ id, includeRaw }) => {
      try {
        const message = await mailProvider.getMessage(id, { includeRaw });
        return buildToolResponse({ provider: mailProvider.name, message });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'search_email',
    {
      title: 'Search Email',
      description: 'Search the configured inbox provider by from, subject, or since date.',
      inputSchema: {
        from: z.string().max(320).optional(),
        subject: z.string().max(200).optional(),
        since: z.string().max(64).optional()
      }
    },
    async ({ from, subject, since }) => {
      try {
        const matches = await mailProvider.searchEmail({ from, subject, since });
        return buildToolResponse({ provider: mailProvider.name, matches, count: matches.length });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  server.registerTool(
    'send_email',
    {
      title: 'Send Email',
      description: 'Send an email from the configured mail provider.',
      inputSchema: {
        to: z.string().email().max(320),
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(10000)
      }
    },
    async ({ to, subject, body }) => {
      try {
        const result = await mailProvider.sendEmail(to, subject, body);
        return buildToolResponse({ provider: mailProvider.name, result });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }
  );

  return server;
}

const allowedHosts = [config.hostname, 'localhost', '127.0.0.1', '::1'];

export const app = createMcpExpressApp({
  host: '0.0.0.0',
  allowedHosts
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'yahoo-mail-mcp',
    version: '0.1.0',
    transport: 'streamable-http',
    mailMode: config.mailMode,
    provider: mailProvider.name
  });
});

app.post('/mcp', requireBearerToken, async (req, res) => {
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

export { config, mailProvider };
