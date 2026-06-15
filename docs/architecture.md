# Architecture

## Repository

```text
ApoRaviz_Tools/
  split-order-txt/
    input/
    output/
    backup/
    src/
```

## split-order-txt Flow

```text
input TXT
-> stream reader
-> header scan
-> output file creation
-> detail scan
-> append detail lines by group
-> move processed input to backup
```

## Why Two Passes

The tool uses two passes over the input file.

Pass 1 finds header records and creates output files with header rows.

Pass 2 streams detail records and appends them to the matching output file.

This avoids loading all detail rows into memory, which matters for very large TXT files.

## Backup Rule

After the split completes successfully, the original input file is moved to `backup/`.

If a backup file with the same name already exists, the tool appends a timestamp to avoid overwriting an older backup.

If splitting fails, the input file stays in `input/`.
