# Shared MCP Infra Plan

This directory is the current source of truth for the shared edge architecture used by the Yahoo MCP and GitHub MCP services.

## Design goal

Run multiple MCP backends behind one public HTTPS edge on ports 80 and 443, route by hostname, and stop treating each MCP repo as its own public-stack snowflake.

## Architecture

```text
Claude / ChatGPT / other MCP clients
  |
  | HTTPS to public hostname on standard port 443
  | Examples:
  | - https://yahoomcp.techthatmattrs.net/mcp
  | - https://githubmcp.techthatmattrs.net/mcp
  v
Public DNS records
  |
  | subdomains point to home public IP
  v
Home router
  |
  | forwards 80/443 to Docker host machine
  v
Docker Host Machine
Windows 11 + Docker Desktop
  |
  +-------------------------------------------------------------+
  | Docker host                                                 |
  |                                                             |
  |  +-------------------------------------------------------+  |
  |  | Shared Caddy HTTPS front end                         |  |
  |  |                                                     |  |
  |  | - owns public 80/443                                |  |
  |  | - terminates TLS                                    |  |
  |  | - routes by hostname                                |  |
  |  | - reverse proxies to backend containers             |  |
  |  +-------------------------+---------------------------+  |
  |                            |                              |
  |                            v                              |
  |   Hostname routing inside shared Docker network:         |
  |                                                          |
  |   yahoomcp.techthatmattrs.net   -> yahoo-mcp:3000        |
  |   githubmcp.techthatmattrs.net  -> github-mcp:3000       |
  |   techthatmattrs.net            -> future-wordpress:8080 |
  |   default / direct IP / unknown -> legacy-web:80         |
  |                                                          |
  |  +----------------------+   +----------------------+      |
  |  | Yahoo MCP container  |   | GitHub MCP container |      |
  |  | - /health            |   | - /health            |      |
  |  | - /mcp               |   | - /mcp               |      |
  |  | - listens on 3000    |   | - listens on 3000    |      |
  |  +----------+-----------+   +----------+-----------+      |
  |             |                          |                  |
  |             | outbound authenticated   | outbound auth    |
  |             | mail traffic             | API traffic      |
  |             v                          v                  |
  |   Yahoo IMAP / SMTP services       GitHub REST API       |
  |                                                          |
  |  +----------------------+                                |
  |  | legacy-web container |                                |
  |  | - default fallback   |                                |
  |  | - IP / unknown host  |                                |
  |  +----------------------+                                |
  +-------------------------------------------------------------+
```

## Principles

- One shared edge owns ports 80 and 443.
- Each MCP repo is backend-only and listens on port 3000 internally.
- Routing is by hostname, not by alternate public port.
- The root WordPress site can remain externally hosted while MCP subdomains point home.
- The legacy IP-only site gets a first-class fallback path.
- A future self-hosted WordPress container can be added later without changing the core MCP pattern.

## What belongs in app repos

Each MCP repo should own:

- app code
- Dockerfile
- local-only compose file
- env example for backend app runtime
- /health endpoint
- /mcp endpoint
- host validation for the public hostname routed through the shared edge

Each MCP repo should stop assuming it owns a dedicated public HTTPS edge.

## What belongs here

This shared infra layer owns:

- shared Caddy edge
- public 80/443 bindings
- hostname routing
- shared Docker network
- backend service wiring
- legacy fallback site
- future optional route expansion

## DNS model

Expected DNS model:

- yahoomcp.techthatmattrs.net -> home public IP
- githubmcp.techthatmattrs.net -> home public IP
- techthatmattrs.net can remain on externally hosted WordPress until a migration is intentionally planned

## Operational notes

- Direct IP access can fall back to legacy-web.
- HTTPS by direct IP will never be as clean as hostname-based TLS because certificate names do not match raw IP access.
- Claude appears to require standard 443 for connector registration even though the alternate-port MCP endpoint itself was valid.
- The shared-edge model exists to satisfy that reality.

## Next implementation steps

1. Refactor Yahoo MCP to backend-only posture.
2. Refactor GitHub MCP to backend-only posture.
3. Use the shared compose stack in this directory to run both behind one Caddy edge.
4. Re-test connector registration on 443 hostnames.
5. Add future services only by introducing new host routes, not new public ports.
