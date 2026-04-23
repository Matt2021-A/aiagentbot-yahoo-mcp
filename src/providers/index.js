import { config } from '../config.js';
import { createMockMailProvider } from './mockProvider.js';
import { createYahooMailProvider } from './yahooProvider.js';

export function createMailProvider() {
  if (config.mailMode === 'mock') {
    return createMockMailProvider();
  }

  return createYahooMailProvider();
}
