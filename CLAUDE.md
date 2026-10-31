# CLAUDE.md

This repository already maintains its canonical AI collaboration guide in `AGENTS.md`.

Read `AGENTS.md` first for:

- repository structure
- stack and runtime requirements
- development and test commands
- backend and frontend architecture
- generated contract rules
- Docker and security automation
- change guidelines for coding agents

Short summary:

- Public FARP (FastAPI + React + PostgreSQL) monorepo boilerplate
- `pnpm` workspaces + `turbo`; the Python API is managed with `uv`
- FastAPI + SQLAlchemy 2.0 async + Alembic in `apps/api`
- React 19 web app in `apps/web`
- Pydantic models are the contract source of truth; TypeScript types are generated into `packages/shared` with `pnpm contracts`
- RTK Query handles API calls and token refresh on the frontend
- Trivy, CodeQL, and Dependabot are configured under `.github/`
- Commit messages must be written in English and follow Conventional Commits v1.0.0
- Use English across docs, code comments, test titles, logs, and user-facing strings unless localization is intentional

When in doubt, treat `AGENTS.md` as the source of truth and keep both files aligned if you add repo-level guidance here.
