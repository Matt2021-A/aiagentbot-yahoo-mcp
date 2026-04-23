import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  YAHOO_EMAIL: z.string().email(),
  YAHOO_APP_PASSWORD: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1),
  PUBLIC_HTTPS_PORT: z.coerce.number().default(8443),
  ACME_EMAIL: z.string().email().optional(),
  DNS_PROVIDER_TOKEN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`[config] Invalid environment configuration: ${details}`);
}

export const config = {
  yahooEmail: parsed.data.YAHOO_EMAIL,
  yahooAppPassword: parsed.data.YAHOO_APP_PASSWORD,
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT,
  acmeEmail: parsed.data.ACME_EMAIL,
  dnsProviderToken: parsed.data.DNS_PROVIDER_TOKEN
};
