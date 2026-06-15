# Implementation Plan

## Step 0 - Repository Setup

- [x] Create `ApoRaviz_Tools`
- [x] Add repository README
- [x] Add product spec, commands, architecture, and future UI notes
- [x] Move `split-order-txt` requirement into project docs as the canonical source

## Step 1 - split-order-txt CLI

- [x] Create Node.js + TypeScript project
- [x] Parse quoted TXT/CSV lines without third-party runtime dependencies
- [x] Read the input with streams
- [x] Detect header records and detail records
- [x] Write one output TXT per header group
- [x] Move successfully processed source file to `backup/`
- [x] Add command documentation

## Step 2 - Validation

- [x] Install dependencies
- [x] Add automated parser and splitter tests
- [x] Run TypeScript build
- [x] Run automated tests
- [ ] Run the sample split command
- [ ] Confirm output files
- [ ] Confirm input file moves to backup

## Step 3 - Portfolio And Docs

- [ ] Add a link to Portfolio after tool behavior is stable
- [ ] Add a case study in `ApoRaviz_Workspace_Docs/projects/tools/`
- [ ] Add reusable Node stream lessons to `_docs` if needed
