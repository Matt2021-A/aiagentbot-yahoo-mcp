import { getMessage, readInbox } from '../imap.js';
import { searchEmail } from '../search.js';
import { sendEmail } from '../smtp.js';

export { getMessage, readInbox, searchEmail, sendEmail };

export function getProviderMetadata() {
  return {
    provider: 'yahoo',
    liveMailAccess: true,
    messageCount: null
  };
}
