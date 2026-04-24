const mockMessages = [
  {
    id: 'mock-1001',
    from: ['alerts@techthatmattrs.net'],
    to: ['aiagentbot.matt2021@yahoo.com'],
    subject: 'Mock alert: nightly backup completed',
    date: '2026-04-23T06:10:00.000Z',
    raw: 'Subject: Mock alert: nightly backup completed\n\nNightly backup completed successfully.'
  },
  {
    id: 'mock-1002',
    from: ['matt@techthatmattrs.net'],
    to: ['aiagentbot.matt2021@yahoo.com'],
    subject: 'Mock task: review MCP compose split',
    date: '2026-04-23T18:42:00.000Z',
    raw: 'Subject: Mock task: review MCP compose split\n\nReview local and public runtime separation.'
  },
  {
    id: 'mock-1003',
    from: ['devnull@example.net'],
    to: ['aiagentbot.matt2021@yahoo.com'],
    subject: 'Mock notice: provider auth still pending',
    date: '2026-04-24T02:30:00.000Z',
    raw: 'Subject: Mock notice: provider auth still pending\n\nContinue using mock mode until Yahoo app passwords become available.'
  }
];

export async function readInbox(limit = 10) {
  return mockMessages.slice(0, limit);
}

export async function getMessage(id) {
  const message = mockMessages.find(entry => entry.id === id);

  if (!message) {
    throw new Error(`Mock message ${id} was not found.`);
  }

  return message;
}

export async function searchEmail(criteria = {}) {
  const fromFilter = criteria.from?.toLowerCase?.();
  const subjectFilter = criteria.subject?.toLowerCase?.();
  const sinceFilter = criteria.since ? new Date(criteria.since) : null;

  return mockMessages.filter(message => {
    const fromMatches = !fromFilter || message.from.some(entry => entry.toLowerCase().includes(fromFilter));
    const subjectMatches = !subjectFilter || message.subject.toLowerCase().includes(subjectFilter);
    const sinceMatches = !sinceFilter || new Date(message.date) >= sinceFilter;

    return fromMatches && subjectMatches && sinceMatches;
  });
}

export async function sendEmail(to, subject, body) {
  return {
    mode: 'mock',
    accepted: [to],
    rejected: [],
    messageId: `mock-send-${Date.now()}`,
    response: 'Mock send accepted. No real email was transmitted.',
    preview: {
      to,
      subject,
      body
    }
  };
}

export function getProviderMetadata() {
  return {
    provider: 'mock',
    liveMailAccess: false,
    messageCount: mockMessages.length
  };
}
