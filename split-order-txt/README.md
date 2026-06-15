# split-order-txt

Split a large order TXT file into multiple TXT files by header group number.

Usage guide in Thai: [`docs/how-to-use.md`](./docs/how-to-use.md)

## Input

Put a TXT file in `input/`.

Header example:

```txt
"2026-06-15 08:05:39","3","PL00126-004927","008",""
```

Detail example:

```txt
"3","0650040062","079656650730 ","2"
```

Try the sample file:

```bash
cp samples/order.txt input/order.txt
```

## Output

The tool creates one output file per group:

```text
output/
  PL00126-004927_3.txt
```

The output file contains the matching header, a blank line, and all detail rows for that group.

## Backup

After the split succeeds, the original input file moves to `backup/`.

If the split fails, the input file stays in `input/`.

## Commands

Install:

```bash
npm install
```

Development:

```bash
npm run dev -- ./input/order.txt
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

Run:

```bash
npm run start -- ./input/order.txt
```

Run with the first `.txt` file in `input/`:

```bash
npm run start
```

Skip backup:

```bash
npm run start -- ./input/order.txt --no-backup
```
