# วิธีใช้งาน split-order-txt

คู่มือนี้สำหรับการใช้งาน `split-order-txt` เพื่อแยกไฟล์ order TXT ขนาดใหญ่เป็นหลายไฟล์ตาม `Group Number`

## โปรแกรมนี้ทำอะไร

โปรแกรมอ่านไฟล์ TXT ที่มี 2 แบบข้อมูลปนกัน:

- Header record: แถวหัวใบงาน มี `Group Number` และ `Order Number`
- Detail record: แถวรายการสินค้า มี `Group Number`, item code, barcode, quantity

โปรแกรมจะรักษาบรรทัดประกอบของไฟล์ export เช่น `3:` หรือ `13:` และ `31629#` ไว้ใน output ทุกไฟล์ด้วย

จากนั้นโปรแกรมจะสร้างไฟล์ output แยกตาม group เช่น:

```txt
output/
  PL00126-004927_3.txt
  PL00126-004928_4.txt
  PL00126-004929_5.txt
```

เมื่อทำงานสำเร็จ โปรแกรมจะย้ายไฟล์ต้นฉบับไปที่ `backup/`

ในแต่ละไฟล์ output จะมี:

- header ของ group นั้น
- บรรทัดคั่นกลางหลัง header เช่น `3:` หรือ `13:`
- detail ของ group นั้น
- บรรทัดปิดท้าย เช่น `31629#`

## เตรียมก่อนใช้งาน

เข้าโฟลเดอร์ tool:

```bash
cd ApoRaviz_Tools/split-order-txt
```

ติดตั้ง dependency ครั้งแรก:

```bash
npm install
```

build โปรแกรม:

```bash
npm run build
```

## วิธีใช้งานแบบปกติ

1. วางไฟล์ `.txt` ไว้ในโฟลเดอร์ `input/`

ตัวอย่าง:

```txt
input/order.txt
```

ถ้าจะลองด้วยไฟล์ตัวอย่างที่มากับโปรเจกต์ ให้ copy จาก `samples/` ไปที่ `input/` ก่อน:

```bash
cp samples/order.txt input/order.txt
```

2. รันคำสั่ง:

```bash
npm run start -- ./input/order.txt
```

3. ดูไฟล์ที่สร้างใน `output/`

ตัวอย่าง:

```txt
output/PL00126-004927_3.txt
```

4. ถ้าสำเร็จ ไฟล์ต้นฉบับจะถูกย้ายไป `backup/`

ตัวอย่าง:

```txt
backup/order.txt
```

## รันโดยไม่ระบุชื่อไฟล์

ถ้าใน `input/` มีไฟล์ `.txt` อยู่แล้ว สามารถรัน:

```bash
npm run start
```

โปรแกรมจะใช้ไฟล์ `.txt` ไฟล์แรกที่เจอใน `input/`

## กำหนด output และ backup เอง

```bash
npm run start -- ./input/order.txt --output ./output --backup ./backup
```

## ไม่ต้องย้ายไฟล์เข้า backup

ใช้ตอนอยากทดลองก่อน:

```bash
npm run start -- ./input/order.txt --no-backup
```

## ตัวอย่างผลลัพธ์บนหน้าจอ

```txt
Reading file...
Found Header: 3
Found Header: 4
Found Header: 5
Writing PL00126-004927_3.txt
Writing PL00126-004928_4.txt
Writing PL00126-004929_5.txt
Moved input to backup: /path/to/backup/order.txt
Completed.
```

## ข้อความ error ที่เจอได้

| ข้อความ | ความหมาย | วิธีแก้ |
|---|---|---|
| `Input file not found: ...` | path ที่ส่งให้โปรแกรมไม่มีไฟล์จริง | วางไฟล์ให้ตรง path หรือ copy `samples/order.txt` ไปที่ `input/order.txt` |
| `Input file is empty.` | ไฟล์ว่าง | ตรวจไฟล์ต้นฉบับอีกครั้ง |
| `Header record not found.` | ไม่เจอแถว header | ตรวจ format ไฟล์ว่ามี header 5 ช่องหรือไม่ |
| `Invalid file format at line ...` | CSV/TXT format ไม่ถูกต้องที่บรรทัดนั้น | ตรวจ quote, comma, จำนวน column |
| `Invalid file format.` | CSV/TXT format ไม่ถูกต้อง | ตรวจ quote, comma, จำนวน column |
| `No .txt file found in input folder.` | รันโดยไม่ระบุไฟล์ แต่ `input/` ไม่มี `.txt` | วางไฟล์ใน `input/` หรือระบุ path เอง |

## เช็กว่าโปรแกรมยังทำงานถูกไหม

รัน build:

```bash
npm run build
```

รัน test:

```bash
npm test
```

หมายเหตุ: บาง environment อาจต้องรัน `npm test` นอก managed sandbox เพราะ `tsx` ใช้ IPC pipe ใน temp folder

## สรุปจำสั้น ๆ

```txt
input/order.txt
-> npm run start -- ./input/order.txt
-> output/{OrderNumber}_{GroupNumber}.txt
-> backup/order.txt
```
