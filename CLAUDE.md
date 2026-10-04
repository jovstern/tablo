# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

tablo is a minimal, real-time collaborative whiteboard for sketching ideas, diagrams and flows in the browser.

## Current state

The repository contains no application code yet: only `README.md` and `.mcp.json` are tracked. No stack, package manager, build, lint, or test tooling has been chosen. Once those exist, document the commands (including how to run a single test) and the architecture here.

## MCP servers

`.mcp.json` configures two project-scoped servers:

- `github`: GitHub's hosted MCP server. It reads the token from the `GITHUB_PAT` environment variable, which must be set in the shell that launches Claude Code.
- `webstorm`: the local WebStorm IDE MCP server at `127.0.0.1:64542`. It is only reachable while WebStorm is running with this project open, and the port is specific to this machine.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on `jovstern/tablo`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels are used unchanged: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
