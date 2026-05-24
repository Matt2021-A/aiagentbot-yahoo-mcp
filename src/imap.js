import { ImapFlow } from 'imapflow';
import { config } from './config.js';

function createClient() {
  return new ImapFlow({
    host: 'imap.mail.yahoo.com',
    port: 993,
    secure: true,
    auth: {
      user: config.yahooEmail,
      pass: config.yahooAppPassword
    }
  });
}

export async function readInbox(limit = 10) {
  const client = createClient();
  await client.connect();

  try {
    const lock = await client.getMailboxLock('INBOX');

    try {
      const exists = client.mailbox.exists || 0;
      if (exists === 0) {
        return [];
      }

      const start = Math.max(1, exists - limit + 1);
      const messages = [];

      for await (const message of client.fetch(`${start}:${exists}`, {
        uid: true,
        envelope: true,
        internalDate: true
      })) {
        messages.push({
          id: String(message.uid),
          from: message.envelope?.from?.map(item => item.address).filter(Boolean) ?? [],
          subject: message.envelope?.subject ?? '',
          date: message.internalDate?.toISOString?.() ?? null
        });
      }

      return messages.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function getMessage(id, options = {}) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new Error('Message id must be a numeric IMAP UID.');
  }

  const client = createClient();
  await client.connect();

  try {
    const lock = await client.getMailboxLock('INBOX');

    try {
      const fetchOptions = {
        uid: true,
        envelope: true,
        internalDate: true
      };

      if (options.includeRaw) {
        fetchOptions.source = true;
      }

      const message = await client.fetchOne(numericId, fetchOptions, { uid: true });

      if (!message) {
        throw new Error(`Message ${id} was not found.`);
      }

      const result = {
        id: String(message.uid),
        from: message.envelope?.from?.map(item => item.address).filter(Boolean) ?? [],
        to: message.envelope?.to?.map(item => item.address).filter(Boolean) ?? [],
        subject: message.envelope?.subject ?? '',
        date: message.internalDate?.toISOString?.() ?? null
      };

      if (options.includeRaw) {
        result.raw = message.source ? message.source.toString() : '';
      }

      return result;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
