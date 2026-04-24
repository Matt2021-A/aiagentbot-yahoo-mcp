import { mockInbox } from './mock/messages.js';

function normalizeMessage(message) {
  return {
    id: message.id,
    from: message.from,
    to: message.to,
    subject: message.subject,
    date: message.date,
    body: message.body,
    raw: message.body
  };
}

export function createMockMailProvider() {
  return {
    name: 'mock',

    async readInbox(limit = 10) {
      return mockInbox.slice(0, limit).map(normalizeMessage);
    },

    async getMessage(id) {
      const message = mockInbox.find(entry => entry.id === id);

      if (!message) {
        throw new Error(`Mock message ${id} was not found.`);
      }

      return normalizeMessage(message);
    },

    async searchEmail(criteria = {}) {
      const fromFilter = criteria.from?.toLowerCase?.();
      const subjectFilter = criteria.subject?.toLowerCase?.();
      const sinceFilter = criteria.since ? new Date(criteria.since) : null;

      return mockInbox
        .map(normalizeMessage)
        .filter(message => {
          const fromMatches = !fromFilter || message.from.some(entry => entry.toLowerCase().includes(fromFilter));
          const subjectMatches = !subjectFilter || message.subject.toLowerCase().includes(subjectFilter);
          const sinceMatches = !sinceFilter || new Date(message.date) >= sinceFilter;

          return fromMatches && subjectMatches && sinceMatches;
        });
    },

    async sendEmail(to, subject, body) {
      if (!to || !subject || !body) {
        throw new Error('to, subject, and body are all required.');
      }

      return {
        dryRun: true,
        accepted: [to],
        rejected: [],
        messageId: `mock-${Date.now()}`,
        response: 'Mock mode enabled. No live email was sent.',
        preview: {
          to,
          subject,
          body
        }
      };
    }
  };
}
