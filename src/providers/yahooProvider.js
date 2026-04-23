import { getMessage, readInbox } from '../imap.js';
import { searchEmail } from '../search.js';
import { sendEmail } from '../smtp.js';

export function createYahooMailProvider() {
  return {
    name: 'yahoo',
    readInbox,
    getMessage,
    searchEmail,
    sendEmail
  };
}
