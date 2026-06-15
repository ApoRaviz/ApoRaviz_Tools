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
- Successfully processed input files should move to the tool's `backup/` folder.
- Failed input files must remain in `input/` for retry/debugging.
- Future UI ideas belong in docs first, especially file upload/download/privacy rules.
- Shared learning still belongs in `ApoRaviz_Workspace_Docs`.

## split-order-txt

- Use Node.js + TypeScript.
- Use stream reading for large TXT files.
- Avoid loading full input files into memory.
- Output files go to `output/`.
- Source files move to `backup/` only after successful completion.
