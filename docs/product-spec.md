# Product Spec

## Product

`ApoRaviz_Tools` is a collection of small utility tools.

The first tool is:

```text
split-order-txt
```

Detailed requirement: [`docs/split-order-txt-requirement.md`](./split-order-txt-requirement.md)

## Problem

Large order TXT files contain header records and detail records mixed by group number. Users need to split the file into smaller files, one output file per order group.

## Primary User

A developer or operator who can run a command-line tool on macOS or Windows.

## First Usable Flow

```text
put TXT file in input/
run npm command
tool creates one TXT per group in output/
tool moves processed source file to backup/
```

## Non Goals For Version 1

- No web UI
- No database
- No file upload page
- No authentication
- No cloud storage

## Future UI

Future UI rules are documented in `docs/future-ui.md`.
