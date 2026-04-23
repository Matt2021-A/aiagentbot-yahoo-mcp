# aiagentbot-yahoo-mcp

Provider-neutral Yahoo Mail MCP service scaffold for Claude-first remote connector use.

This repo now has the first real project scaffold for a Yahoo Mail MCP service that:

- uses the official MCP TypeScript SDK
- uses Streamable HTTP
- runs locally in Docker Desktop
- is designed for alternate-port public HTTPS
- assumes ports 80 and 443 are unavailable to this project
- keeps the existing website stack completely out of scope

## Current status

This is a starter scaffold, not a finished production service yet.

What is already in the repo:

- app entrypoint
- config loader
- IMAP read module scaffold
- SMTP send module scaffold
- mailbox search scaffold
- MCP server scaffold with four tools
- Dockerfile
- Docker Compose file
- Caddyfile scaffold
- custom Caddy build scaffold with Cloudflare DNS plugin
- env template and ignore files

What still needs hands-on work:

- install dependencies locally and confirm the app boots
- verify the MCP SDK route behavior against Claude in practice
- create the real `.env`
- decide and confirm the final hostname
- create the Cloudflare DNS token
- test local Docker startup
- test public alternate-port HTTPS
- add the final connector in Claude and validate all four tools

## Architecture

```text
Claude
  |
  | HTTPS to public hostname on alternate port
  | Example: https://yahoomcp.example.com:8443
  v
Public DNS record
  |
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
  |  | Caddy HTTPS front end                    |  |
  |  |                                          |  |
  |  | - listens on alternate HTTPS port        |  |
  |  | - gets certificate with DNS-01           |  |
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

## Repo layout

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Caddyfile
├── Dockerfile
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
    └── smtp.js
```

## Environment variables

Create a local `.env` file based on `.env.example`.

Expected values:

```env
YAHOO_EMAIL=aiagentbot.matt2021@yahoo.com
YAHOO_APP_PASSWORD=replace_with_real_app_password
PORT=3000
HOSTNAME=yahoomcp.example.com
PUBLIC_HTTPS_PORT=8443
ACME_EMAIL=you@example.com
CF_API_TOKEN=replace_with_real_cloudflare_token
```

Important:

- do not commit `.env`
- do not paste secrets into GitHub issues, PRs, or Asana comments
- the Cloudflare token should be narrowly scoped to DNS changes for the relevant zone

## Why Cloudflare is the current default

This scaffold assumes DNS-01 certificate validation because ports 80 and 443 are unavailable to this project. The included Caddy build uses the Cloudflare DNS plugin as the default no-budget automation path.

If you use a different DNS provider later, you will need to swap:

- the custom Caddy plugin build
- the token variable name
- the DNS challenge line in `Caddyfile`

## First-run local steps

### 1. Clone the repo and switch to your working branch

```bash
git clone https://github.com/Matt2021-A/aiagentbot-yahoo-mcp.git
cd aiagentbot-yahoo-mcp
git checkout dev/docker-streamable-http-scaffold-20260423
```

### 2. Create `.env`

Copy `.env.example` to `.env` and replace placeholders with real values.

### 3. Install Node dependencies locally

```bash
npm install
```

### 4. Start Docker Desktop

Make sure Docker Desktop is running before using Compose.

### 5. Build and start the local stack

```bash
docker compose up --build
```

### 6. Check logs

You want both containers to stay up:

- `yahoo-mcp-app`
- `yahoo-mcp-caddy`

### 7. Test local health endpoint

Because the scaffold currently maps app port 3000 locally, test:

```text
http://localhost:3000/health
```

You can also test through the HTTPS front end once DNS and certificate setup are complete.

## Public alternate-port deployment steps

### 1. Pick the final hostname

Example:

```text
yahoomcp.example.com
```

### 2. Point DNS to the home public IP

Create the DNS record for the hostname in Cloudflare.

### 3. Create the Cloudflare API token

Recommended minimum permissions for the zone used by this service:

- Zone.Zone:Read
- Zone.DNS:Edit

Store it securely and put the actual value only in `.env`.

### 4. Confirm router forwarding

Forward the chosen public port, likely `8443`, to the Docker host machine.

### 5. Start the stack in detached mode

```bash
docker compose up -d --build
```

### 6. Watch for certificate issuance

Caddy should use DNS-01 to obtain the certificate.

### 7. Test from outside the house

Use mobile data or another external network and test:

```text
https://yahoomcp.example.com:8443/health
```

You want:

- valid HTTPS
- no certificate warning
- healthy JSON response

## Claude connector path

Once public HTTPS works:

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
- the Caddy path is opinionated toward Cloudflare because it is the cleanest zero-budget DNS automation lane for this project

## What I would do next

1. create the real `.env`
2. run `npm install`
3. run `docker compose up --build`
4. confirm `http://localhost:3000/health`
5. if local app boot works, move to DNS and alternate-port public testing
6. only after public HTTPS is good, add the Claude connector

That is the shape of the work now. The repo has stopped being an empty shell and started becoming an actual service.