import { readInbox } from './imap.js';

export async function searchEmail(criteria = {}) {
  const recentMessages = await readInbox(200);
  const fromFilter = criteria.from?.toLowerCase?.();
  const subjectFilter = criteria.subject?.toLowerCase?.();
  const sinceFilter = criteria.since ? new Date(criteria.since) : null;

  return recentMessages.filter(message => {
    const fromMatches = !fromFilter || message.from.some(entry => entry?.toLowerCase?.().includes(fromFilter));
    const subjectMatches = !subjectFilter || message.subject.toLowerCase().includes(subjectFilter);
    const sinceMatches = !sinceFilter || (message.date && new Date(message.date) >= sinceFilter);

    return fromMatches && subjectMatches && sinceMatches;
  });
}
