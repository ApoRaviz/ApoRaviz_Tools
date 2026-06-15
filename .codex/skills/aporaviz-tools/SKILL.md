---
name: aporaviz-tools
description: Work on the ApoRaviz_Tools repository, which contains small runnable utility tools such as split-order-txt. Use CLI-first behavior, keep finished inputs in backup folders, and document any future UI separately before building it.
---

# ApoRaviz Tools Skill

Use this skill when working in `ApoRaviz_Tools`.

## Rules

- Treat `ApoRaviz_Tools` as a utility repository, not a frontend showcase.
- Keep each tool in its own folder.
- Version 1 tools should be runnable from command line before any UI is added.
- When adding a new tool, create it under `ApoRaviz_Tools/<tool-name>/`.
- Each tool should have project-local usage docs such as `README.md` and `docs/how-to-use.md` when the workflow is not obvious.
- Update the root `README.md` tool table whenever a new tool is added.
- Update `progress.md` and `docs/implementation-plan.md` when tool status changes.
- Store tool-specific requirements in `docs/<tool-name>-requirement.md` or another clearly named project doc.
- Successfully processed input files should move to the tool's `backup/` folder.
- Failed input files must remain in `input/` for retry/debugging.
- Future UI ideas belong in docs first, especially file upload/download/privacy rules.
- Shared learning still belongs in `ApoRaviz_Workspace_Docs`; capture reusable Node.js, NestJS, CLI, stream, testing, file upload/download, and backend architecture lessons there without waiting for the user to ask again.
- Do not push changes unless the user explicitly asks to push.
- For future backend work, default to Angular frontend + NestJS backend + PostgreSQL/Supabase database.

## New Tool Checklist

When the user adds or asks for another utility tool:

- Create `ApoRaviz_Tools/<tool-name>/`.
- Add tool-local docs: `README.md` and `docs/how-to-use.md` when useful.
- Add `src/` and `test/` for coded tools.
- Add `package.json` only when that tool needs its own Node.js project.
- Add or update `docs/<tool-name>-requirement.md` for product-specific rules.
- Update root `README.md`, `progress.md`, and `docs/implementation-plan.md`.
- Decide what belongs in `_docs`: Node.js/NestJS concepts, reusable CLI patterns, testing patterns, and project case-study learning.
- Run build/test when the tool has code, and report any command that could not be run.

## split-order-txt

- Use Node.js + TypeScript.
- Use stream reading for large TXT files.
- Avoid loading full input files into memory.
- Output files go to `output/`.
- Source files move to `backup/` only after successful completion.
- Preserve export wrapper rows such as separator lines (`13:`) and trailer lines (`31629#`) in every output file when the input format requires them.
- Keep source comments useful for learning Node.js, but prefer comments that explain intent, flow, edge cases, or unfamiliar APIs over comments that merely restate simple code.
