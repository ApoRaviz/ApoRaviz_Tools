# Commands

## split-order-txt

```bash
cd split-order-txt
```

Install dependencies:

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

Note: `tsx --test` may need to run outside the managed sandbox because it opens an IPC pipe in the temp folder.

Run compiled CLI:

```bash
npm run start -- ./input/order.txt
```

Run with default input:

```bash
npm run start
```

When no input path is provided, the tool uses the first `.txt` file in `input/`.

Custom folders:

```bash
npm run start -- ./input/order.txt --output ./output --backup ./backup
```

Skip backup:

```bash
npm run start -- ./input/order.txt --no-backup
```
