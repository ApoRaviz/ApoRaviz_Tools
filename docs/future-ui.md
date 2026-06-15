# Future UI Direction

Version 1 is a CLI tool. Do not start with a web UI unless the CLI behavior is already stable.

## When UI Becomes Useful

Build a UI later if the user needs:

- Select file from browser
- Click split
- Download result as a zip
- See validation errors without opening terminal
- Let non-developers use the tool

## Recommended Future Stack

If this becomes a web app inside the ApoRaviz ecosystem:

```text
Angular 22
Node 24 LTS
Tailwind CSS v4
Standalone components
Signals
SSR/prerender only if it becomes a public demo page
```

## UI Safety Rules

- Do not upload files to a server by default.
- Prefer browser-only processing for small files.
- For large files, keep the CLI path because browser memory can become a problem.
- If server upload is required later, document file size limit, storage location, cleanup rule, and privacy risk first.
- Download split results as `.zip`.
- Keep `backup/` as a CLI concept only unless the server-side flow is explicitly designed.

## Future UI Flow

```text
open page
select TXT file
validate format
show detected header count
click Split
download zip
show summary
```

## Portfolio Rule

Add this tool to `ApoRaviz_Portfolio` only after:

- CLI build passes
- sample file split works
- README explains input/output/backup
- GitHub repository is available
