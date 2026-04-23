export const mockInbox = [
  {
    id: 'mock-1001',
    from: ['ops@example.net'],
    to: ['bot@example.net'],
    subject: 'Welcome to mock mode',
    date: '2026-04-24T09:00:00.000Z',
    body: 'This is a canned message used for local MCP development while live Yahoo auth is blocked.'
  },
  {
    id: 'mock-1002',
    from: ['alerts@example.net'],
    to: ['bot@example.net'],
    subject: 'Daily build status',
    date: '2026-04-24T10:15:00.000Z',
    body: 'Build completed successfully. Mock mail mode is useful for local contract testing.'
  },
  {
    id: 'mock-1003',
    from: ['builder@example.net'],
    to: ['bot@example.net'],
    subject: 'Follow up on Yahoo app password blocker',
    date: '2026-04-24T11:30:00.000Z',
    body: 'Pause the live Yahoo path for now but keep improving the MCP service itself.'
  }
];
