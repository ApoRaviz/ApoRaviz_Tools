# ApoRaviz Tools

Small utility tools for the ApoRaviz workspace.

This repository is for practical tools that are useful but too small to become a full standalone app.

## Tools

| Tool | Purpose | Status |
|---|---|---|
| `split-order-txt` | Split large order TXT files by header group number | First usable CLI |

Detailed requirement: [`docs/split-order-txt-requirement.md`](./docs/split-order-txt-requirement.md)
Usage guide: [`split-order-txt/docs/how-to-use.md`](./split-order-txt/docs/how-to-use.md)

## Repository Role

```text
ApoRaviz_Tools     = runnable utility tools
ApoRaviz_Portfolio = profile and showcase link hub
ApoRaviz_Workspace_Docs = requirement, learning notes, and case studies
```

Do not put shared learning only in this repo. If a tool creates reusable knowledge, capture it in `ApoRaviz_Workspace_Docs`.

## Quick Start

```bash
cd split-order-txt
npm install
npm run build
npm run start -- ./input/order.txt
```

After a file is split successfully, the original input file is moved to `backup/`.
