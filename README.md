# aiagentbot-yahoo-mcp

Provider-neutral Yahoo Mail MCP service scaffold for Claude-first remote connector use.

This repo tracks the Yahoo MCP as a backend application that is intended to sit behind a shared HTTPS edge on ports 80 and 443, alongside other MCP services.

## Current status

This is a working backend scaffold, not a finished production service yet.

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
- committed package lock for reproducible installs
- published Docker image
- shared infra plan and example stack under `mcp-infra/`

What still needs hands-on work:

- complete the shared-edge deployment path on standard 443
- validate live Yahoo IMAP and SMTP behavior
- implement the final Yahoo live-auth path once developer access is approved
- keep the shared edge flow aligned with the GitHub MCP and future services

## Architecture

The canonical shared-edge design now lives in `mcp-infra/README.md`.

In plain English:

- clients connect over HTTPS on standard port 443
- public DNS subdomains point to the home public IP
- the router forwards 80/443 to the Windows 11 Docker host
- one shared Caddy edge routes by hostname
- Yahoo MCP runs as a backend container on port 3000
- GitHub MCP and future services follow the same model

The old per-repo public edge pattern and alternate-port public exposure are no longer the intended end state.

## Auth direction

The long-term preferred Yahoo auth model is now:

- Yahoo developer access approval
- OAuth-based mail access for the authenticated mailbox owner

The older consumer app-password path is now treated as a fallback or temporary validation path, not the primary architecture. That means the README, Asana tasks, and deployment story should be read as moving toward a real user-authorized mail application model rather than centering on mailbox workarounds.

Important:

- OAuth mail access is not implemented in this repo yet
- current development still uses `MAIL_MODE=mock`
- any app-password-based live validation should be treated as transitional if used at all

## Tool surface

The scaffold registers these four MCP tools:

1. `send_email`
2. `read_inbox`
3. `search_email`
4. `get_message`

These four tools give the service a clear operational mail surface for reading, looking up, searching, and sending mail.

## Published image

Published image:

```text
iwashuman2021/mcp:yahoo-mcp-latest
```

Pull it with:

```bash
docker pull iwashuman2021/mcp:yahoo-mcp-latest
```

## Repo layout

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── compose.yaml
├── index.js
├── mcp-infra/
│   ├── Caddyfile
│   ├── README.md
│   ├── compose.yaml
│   ├── env/
│   │   ├── github.env.example
│   │   └── yahoo.env.example
│   └── legacy-web/
│       └── index.html
├── package.json
├── package-lock.json
└── src/
    ├── config.js
    ├── imap.js
    ├── search.js
    ├── server.js
    ├── smtp.js
    └── providers/
```

## Local development

### `.env.example`

Expected values:

```env
MAIL_MODE=mock
YAHOO_EMAIL=aiagentbot.matt2021@yahoo.com
YAHOO_APP_PASSWORD=set_when_live_mode_is_ready
PORT=3000
HOST_PORT=3001
HOSTNAME=yahoomcp.techthatmattrs.net
PUBLIC_HTTPS_PORT=443
```

Important:

- do not commit `.env`
- do not paste secrets into GitHub issues, PRs, Asana comments, or chat logs
- keep `MAIL_MODE=mock` until a live auth path is intentionally validated
- `YAHOO_APP_PASSWORD` remains in the env example because the current code still supports that path, but it is no longer the preferred long-term design

### Run locally

```bash
docker compose up --build
```

Then test:

```bash
curl http://localhost:3001/health
```

### Direct local runtime

```bash
npm install
npm start
curl http://localhost:3000/health
```

## Shared infra source of truth

The shared edge stack now lives under `mcp-infra/` in this repo.

That directory contains:

- the shared Caddy edge example
- the shared compose stack for Yahoo MCP, GitHub MCP, and the legacy fallback site
- example env files for both MCP backends
- the current design notes for the multi-service 443 model

## Operational notes

- This repo should be treated as a backend app repo, not as a standalone public TLS edge.
- The current service still reports its hostname and public HTTPS port for health and host-validation purposes.
- Host validation should continue to trust the configured public hostname routed through the shared edge.
- The repo is still in a transitional state where the shared-edge platform direction is set, but the Yahoo live-auth implementation has not yet been converted to the preferred OAuth path.

## What I would do next

1. keep using mock mode while Yahoo developer access is under review
2. align the GitHub MCP repo to the same backend-only pattern and keep both behind the shared edge
3. implement the approved Yahoo live-auth path once developer access details are available
4. validate the Yahoo connector again through the shared 443 hostname

That is the shape of the work now. The Yahoo MCP is no longer the special-case public edge. It is one backend in a shared MCP platform model, and its long-term auth direction is now the Yahoo developer-access OAuth path.
