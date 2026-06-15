# split-order-txt Requirement

## Project Name

`ApoRaviz_Tools / split-order-txt`

## Objective

Create a Node.js + TypeScript utility tool that can split a large TXT file into multiple TXT files based on Header Group Number.

The tool is part of the `ApoRaviz_Tools` repository.

## Technology Stack

- Node.js latest LTS
- TypeScript
- npm
- macOS compatible
- No database
- No frontend UI
- Console application

## Input File Format

### Header Record

Example:

```txt
"2026-06-15 08:05:39","3","PL00126-004927","008",""
"2026-06-15 08:05:39","4","PL00126-004928","015",""
"2026-06-15 08:05:39","5","PL00126-004929","016",""
```

Header structure:

| Index | Description |
|---|---|
| 0 | Datetime |
| 1 | Group Number |
| 2 | Order Number |
| 3 | Branch |
| 4 | Empty |

Example:

```txt
Group Number = 3
Order Number = PL00126-004927
```

### Detail Record

Example:

```txt
"3","0650040062","079656650730 ","2"
"3","1101020003","2011010200036","3"

"4","0711010142","8850002026063","4"
"4","0744020027","8850002030206","2"

"5","1101020057","1101020040003","2"
```

Detail structure:

| Index | Description |
|---|---|
| 0 | Group Number |
| 1 | Item Code |
| 2 | Barcode |
| 3 | Quantity |

## Business Rules

### Header Matching

Header Group Number:

```txt
"2026-06-15 08:05:39","3","PL00126-004927","008",""
```

must match all Detail rows starting with:

```txt
"3",
```

### Example Output

Header:

```txt
"2026-06-15 08:05:39","3","PL00126-004927","008",""
```

Details:

```txt
"3","0650040062","079656650730 ","2"
"3","1101020003","2011010200036","3"
```

Output file:

```txt
PL00126-004927_3.txt
```

contains:

```txt
"2026-06-15 08:05:39","3","PL00126-004927","008",""

"3","0650040062","079656650730 ","2"
"3","1101020003","2011010200036","3"
```

## Output Folder

```txt
output/
├── PL00126-004927_3.txt
├── PL00126-004928_4.txt
└── PL00126-004929_5.txt
```

Naming convention:

```txt
{OrderNumber}_{GroupNumber}.txt
```

Example:

```txt
PL00126-004927_3.txt
```

## Project Structure

```txt
ApoRaviz_Tools
└── split-order-txt
    ├── input
    ├── output
    ├── backup
    ├── src
    │   ├── parser.ts
    │   ├── splitter.ts
    │   ├── writer.ts
    │   └── index.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## Performance Requirements

The input file may contain:

- 10,000+ orders
- 100,000+ detail records
- Very large TXT files

Requirements:

- Use stream reader
- Avoid loading the entire file into memory
- Support large file processing
- Fast execution
- Low memory usage

## Error Handling

Handle these cases:

| Case | Message |
|---|---|
| Empty file | `Input file is empty.` |
| Missing header | `Header record not found.` |
| Invalid CSV format | `Invalid file format.` |
| Missing output folder | Create automatically |
| Missing backup folder | Create automatically |

## Logging

Display progress:

```txt
Reading file...
Found Header: 3
Found Header: 4
Found Header: 5

Writing PL00126-004927_3.txt
Writing PL00126-004928_4.txt
Writing PL00126-004929_5.txt

Completed.
```

## Backup Rule

After the split completes successfully, move the original input file to:

```txt
backup/
```
