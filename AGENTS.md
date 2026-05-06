# Project Rules For Codex

## Validation Commands

- After editing code in this project, do not automatically run build or debug commands.
- This includes `npm run build`, `npm run dev`, `npm run serve`, `npm run preview`, Vite dev/preview commands, local server startup, and browser-based debugging or screenshots.
- Only run those commands when the user explicitly asks for that validation in the current conversation.
- Read-only inspection such as reviewing diffs or source files is allowed.
- When reporting completed work, mention that build/debug validation was skipped because this project rule requests it.
