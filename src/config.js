import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  MAIL_MODE: z.enum(['mock', 'yahoo']).default('mock'),
  YAHOO_EMAIL: z.string().email().optional(),
  YAHOO_APP_PASSWORD: z.string().min(1).optional(),
  MCP_BEARER_TOKEN: z.string().min(32).optional(),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1),
  PUBLIC_HTTPS_PORT: z.coerce.number().default(443)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`[config] Invalid environment configuration: ${details}`);
}

if (parsed.data.MAIL_MODE === 'yahoo') {
  const missing = [];

  if (!parsed.data.YAHOO_EMAIL) {
    missing.push('YAHOO_EMAIL');
  }

  if (!parsed.data.YAHOO_APP_PASSWORD) {
    missing.push('YAHOO_APP_PASSWORD');
  }

  if (!parsed.data.MCP_BEARER_TOKEN) {
    missing.push('MCP_BEARER_TOKEN');
  }

  if (missing.length > 0) {
    throw new Error(`[config] MAIL_MODE=yahoo requires: ${missing.join(', ')}`);
  }
}

export const config = {
  mailMode: parsed.data.MAIL_MODE,
  yahooEmail: parsed.data.YAHOO_EMAIL ?? '',
  yahooAppPassword: parsed.data.YAHOO_APP_PASSWORD ?? '',
  mcpBearerToken: parsed.data.MCP_BEARER_TOKEN ?? '',
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT
};
