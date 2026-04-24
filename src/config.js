import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  MAIL_MODE: z.enum(['mock', 'yahoo']).default('mock'),
  YAHOO_EMAIL: z.string().email().optional(),
  YAHOO_APP_PASSWORD: z.string().min(1).optional(),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1),
  PUBLIC_HTTPS_PORT: z.coerce.number().default(8443),
  ACME_EMAIL: z.string().email().optional()
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

  if (missing.length > 0) {
    throw new Error(`[config] MAIL_MODE=yahoo requires: ${missing.join(', ')}`);
  }
}

export const config = {
  mailMode: parsed.data.MAIL_MODE,
  yahooEmail: parsed.data.YAHOO_EMAIL ?? 'aiagentbot.matt2021@yahoo.com',
  yahooAppPassword: parsed.data.YAHOO_APP_PASSWORD ?? '',
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT,
  acmeEmail: parsed.data.ACME_EMAIL
};
