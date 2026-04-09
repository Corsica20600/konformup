# Codex Project Guide

## Project Summary

- Stack: Next.js, TypeScript, Tailwind CSS, Supabase
- Package manager: `npm`
- Main app commands are defined in `package.json`

## Setup

- Install dependencies: `npm install`
- Create local env file: copy `.env.example` to `.env.local`
- Fill in Supabase variables before running the app

## Run

- Start development server: `npm run dev`
- Default local URL: `http://localhost:3000`

## Quality Checks

- Run lint: `npm run lint`
- Run type check: `npm run typecheck`
- Run tests: `npm run test`
- Create production build: `npm run build`

## Notes For Agents

- Prefer `npm` for all project commands.
- Run `npm install` before other commands if `node_modules` is missing.
- Use `npm run typecheck` after significant TypeScript edits.
- Use `npm run build` before finishing substantial UI or data-layer changes.
- Tests currently run through Vitest and are allowed to pass even if no test files exist yet.
