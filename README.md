# aiagentbot-yahoo-mcp

Provider-neutral Yahoo Mail MCP service scaffold for Claude-first remote connector use.

This repo now has the first real project scaffold for a Yahoo Mail MCP service that:

- uses the official MCP TypeScript SDK
- uses Streamable HTTP
- runs locally in Docker Desktop
- separates local development from public HTTPS deployment
- is designed for alternate-port public HTTPS
- assumes ports 80 and 443 are unavailable to this project
- keeps the existing website stack completely out of scope

## Current status

This is a working local scaffold, not a finished production service yet.

What is already in the repo:

- app entrypoint
- config loader
- IMAP read module scaffold
- SMTP send module scaffold
- mailbox search scaffold
- MCP server scaffold with four tools
- mock mail mode and provider abstraction
- app Dockerfile
- local compose file
- public compose file
- env template and ignore files
- published Docker image

What still needs hands-on work:

- verify the MCP SDK route behavior against Claude in practice
- wait for Yahoo app-password eligibility on the target account
- validate live Yahoo IMAP and SMTP behavior
- finalize the public HTTPS certificate path for the current DNS environment
- add and commit a package lock so the Docker build can move from `npm install` to `npm ci`
- add the final connector in Claude and validate all four tools

## Architecture

```text
Claude
  |
  | HTTPS to public hostname on alternate port
  | Target hostname: yahoomcp.techthatmattrs.net:8443
  v
WordPress.com DNS
  |
  | A record for yahoomcp.techthatmattrs.net
  | points to home public IP
  v
Home router
  |
  | forwards chosen external port to Docker host
  v
Windows PC running Docker Desktop
  |
  +------------------------------------------------+
  | Docker host                                    |
  |                                                |
  |  +------------------------------------------+  |
  |  | Public HTTPS front end                   |  |
  |  |                                          |  |
  |  | - listens on alternate HTTPS port        |  |
  |  | - certificate path still being finalized |  |
  |  | - reverse proxies to app container       |  |
  |  +-------------------+----------------------+  |
  |                      |                         |
  |                      v                         |
  |  +------------------------------------------+  |
  |  | Yahoo MCP app container                  |  |
  |  |                                          |  |
  |  | - Node runtime                           |  |
  |  | - official MCP TypeScript SDK            |  |
  |  | - Streamable HTTP                        |  |
  |  | - tools: send_email, read_inbox,         |  |
  |  |   search_email, get_message              |  |
  |  +-------------------+----------------------+  |
  +----------------------|-------------------------+
                         |
                         | outbound authenticated mail traffic
                         v
                 Yahoo Mail services
                 - IMAP: imap.mail.yahoo.com:993 TLS
                 - SMTP: smtp.mail.yahoo.com:465 secure
```

## Tool surface

The scaffold registers these four MCP tools:

1. `send_email`
2. `read_inbox`
3. `search_email`
4. `get_message`

These four tools give the service a clear operational mail surface for reading, looking up, searching, and sending mail.

## Published image

Published image:

- `iwashuman2021/mcp:yahoo-mcp-latest`

Pull it with:

```bash
docker pull iwashuman2021/mcp:yahoo-mcp-latest
```

Use this image when you want to run the current published app container without building from source locally.

## Repo layout

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Caddyfile
├── Dockerfile
├── compose.public.yaml
├── compose.yaml
├── docker/
│   └── caddy/
│       └── Dockerfile
├── index.js
├── package.json
└── src/
    ├── config.js
    ├── imap.js
    ├── search.js
    ├── server.js
    ├── smtp.js
    └── providers/
```

## Compose file split

This repo now has two run modes on purpose.

### `compose.yaml`
Local development only.

Use this when you want:
- the app container only
- no public edge service
- no certificate dependency
- a simple local health check on `http://localhost:3000/health`

Container name in this mode:
- `yahoomcp-app-local`

### `compose.public.yaml`
Public-stack mode.

Use this when you want:
- the app container
- the public HTTPS front end
- alternate-port public exposure

Container names in this mode:
- `yahoomcp-app-public`
- `yahoomcp-edge-public`

Important:
The current public compose path still reflects earlier Cloudflare-oriented work and needs one more documentation and implementation pass to fully match the WordPress.com DNS architecture.

## Docker build posture

The app Dockerfile now uses:
- a multi-stage build
- production-only dependency install
- a non-root runtime user

This trims the runtime image and removes some unnecessary build-time baggage from the final container.

The next Docker follow-up is to commit a package lock and switch the build fully to `npm ci`.

## Environment variables

Create a local `.env` file based on `.env.example`.

Expected values:

```env
MAIL_MODE=mock
YAHOO_EMAIL=aiagentbot.matt2021@yahoo.com
YAHOO_APP_PASSWORD=replace_with_real_app_password_when_available
PORT=3000
HOSTNAME=yahoomcp.techthatmattrs.net
PUBLIC_HTTPS_PORT=8443
ACME_EMAIL=you@example.com
CF_API_TOKEN=legacy_placeholder_only_for_old_public_path
```

Important:

- do not commit `.env`
- do not paste secrets into GitHub issues, PRs, or Asana comments
- `MAIL_MODE=mock` is the current default development path
- `MAIL_MODE=yahoo` should only be used once Yahoo app-password creation is available for the target account
- `CF_API_TOKEN` is no longer the intended long-term DNS direction for this project

## DNS reality for this project

The public hostname currently lives under:

- `yahoomcp.techthatmattrs.net`

DNS is being managed through the existing `techthatmattrs.net` environment rather than a migrated Cloudflare-managed zone.

That means:
- the A record for `yahoomcp.techthatmattrs.net` points to the home public IP
- WordPress.com DNS is part of the real deployment story
- the public certificate path needs to be aligned with that reality before the final external connector path is considered complete

## Local development steps

### 1. Clone the repo

```bash
git clone https://github.com/Matt2021-A/aiagentbot-yahoo-mcp.git
cd aiagentbot-yahoo-mcp
git checkout main
```

### 2. Create `.env`

Copy `.env.example` to `.env` and replace placeholders with real values.

For local boot, leave `MAIL_MODE=mock`.

### 3. Install Node dependencies locally

```bash
npm install
```

### 4. Start the app directly if you want the fastest boot test

```bash
npm start
```

Then test:

```text
http://localhost:3000/health
```

### 5. Start the local Docker stack

```bash
docker compose up --build
```

### 6. Check logs

You want the local app container to stay up:

- `yahoomcp-app-local`

### 7. Test local health endpoint

```text
http://localhost:3000/health
```

## Deploy from the published image

### Run the app container directly

Create a local `.env` file first, then run:

```bash
docker run --rm --env-file .env -p 3000:3000 iwashuman2021/mcp:yahoo-mcp-latest
```

Then test:

```bash
curl http://localhost:3000/health
```

### Notes

- this is the quickest way to run the published app container without building locally
- default development flow currently uses `MAIL_MODE=mock`
- switch to `MAIL_MODE=yahoo` only after Yahoo app-password creation becomes available
- this runs the app container only, not the full final public-edge deployment story

## Public deployment notes

The intended public target is:

```text
yahoomcp.techthatmattrs.net:8443
```

What is already true:
- the hostname exists
- the A record points to the home public IP
- the router/public-port direction is based on alternate-port exposure, not 80/443

What is still pending:
- the final certificate method that matches WordPress.com DNS
- the final public edge validation from an external network
- the final Claude connector registration and testing

## Claude connector path

Once public HTTPS works cleanly:

1. add the final public connector URL in Claude
2. start a fresh Claude session
3. confirm the four tools appear
4. validate in this order:
   - `read_inbox`
   - `get_message`
   - `search_email`
   - `send_email`

## Notes on the current scaffold

A few honest truths:

- the search implementation is intentionally simple right now
- the IMAP UID handling may need refinement once live Yahoo testing starts
- the Streamable HTTP route is scaffolded from the stateless pattern, which is good for getting moving but still needs real client validation
- the local and public Compose paths are intentionally separate so local app testing does not depend on public-edge decisions
- the public documentation now reflects WordPress.com DNS as the current hostname path, but the public certificate implementation still needs one more cleanup pass
- the Docker image is leaner than the original starter image, but there is still room to improve once a package lock is committed

## What I would do next

1. keep using mock mode while Yahoo app-password creation is unavailable
2. validate the four tools in mock mode end to end
3. clean up the public HTTPS implementation so it matches the WordPress.com DNS reality
4. create and commit a package lock from a normal local environment
5. switch the Docker build to `npm ci`
6. resume live Yahoo validation once app-password creation is available

That is the shape of the work now. The repo has stopped being an empty shell and started becoming an actual service.