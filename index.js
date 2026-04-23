import { app, config } from './src/server.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[startup] Yahoo MCP service listening on port ${config.port}`);
  console.log(`[startup] Public hostname target: ${config.hostname}`);
  console.log(`[startup] Public HTTPS port target: ${config.publicHttpsPort}`);
  console.log(`[startup] Yahoo sender identity: ${config.yahooEmail}`);
});
