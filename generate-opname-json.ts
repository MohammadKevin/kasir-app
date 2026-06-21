import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = String(dateStr).trim();
  if (cleanStr.includes(' ')) {
    const [datePart, timePart] = cleanStr.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  if (cleanStr.includes('-')) {
    const [day, month, year] = cleanStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const num = Number(cleanStr);
  if (!isNaN(num) && num > 30000) {
    const utcDays = num - 25569;
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
  }
  return new Date(cleanStr);
}

async function main() {
  console.log('=== GENERATING LOCALSTORAGE JSON FOR STOCK OPNAME HISTORY ===');
  
  const stores = await prisma.store.findMany();
  let store = stores.find(s => s.name.toLowerCase().includes('laila')) || stores[0];
  
  const products = await prisma.product.findMany({
    where: { storeId: store.id, deletedAt: null },
    include: { category: true }
  });

  function findProduct(sku: any, name: string) {
    const skuStr = sku ? String(sku).trim().toLowerCase() : '';
    const nameStr = name ? String(name).trim().toLowerCase() : '';
    if (skuStr) {
      const match = products.find(p => p.sku && p.sku.toLowerCase() === skuStr);
      if (match) return match;
    }
    const key = nameStr;
    const matchByNameExact = products.find(p => p.name.toLowerCase() === key);
    if (matchByNameExact) return matchByNameExact;

    return products.find(p => p.name.toLowerCase().includes(nameStr) || nameStr.includes(p.name.toLowerCase()));
  }

  const baseDir = path.join(__dirname, 'pawoon-files');
  const opnameDir = path.join(baseDir, 'opname');
  const localHistory: any[] = [];

  if (fs.existsSync(opnameDir)) {
    const files = fs.readdirSync(opnameDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    
    for (const file of files) {
      const filePath = path.join(opnameDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const dateRow = rows.find(r => r[0] === 'Tanggal');
      const dateStr = dateRow ? dateRow[1] : '';
      const createdAt = parseDateString(dateStr);

      let headerIdx = 5;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        if (rows[r] && rows[r].includes('Jumlah Barang Sistem')) {
          headerIdx = r;
          break;
        }
      }

      const headers = rows[headerIdx];
      if (!headers) continue;

      const skuIdx = headers.indexOf('Sku');
      const nameIdx = headers.indexOf('Nama');
      const systemStockIdx = headers.indexOf('Jumlah Barang Sistem');
      const actualStockIdx = headers.indexOf('Jumlah_Barang_Aktual');

      const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);
      const items: any[] = [];

      for (const row of dataRows) {
        const sku = row[skuIdx];
        const name = String(row[nameIdx] || '');
        const systemStock = Number(row[systemStockIdx] || 0);
        const actualStock = String(row[actualStockIdx] || '0');

        const product = findProduct(sku, name);
        if (!product) continue;

        items.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku || '',
          productCategory: product.category?.name || 'Umum',
          systemStock,
          actualStock,
          note: 'Migrasi Pawoon'
        });
      }

      if (items.length === 0) continue;

      const randomId = `OPN-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      
      localHistory.push({
        id: randomId,
        storeId: store.id,
        storeName: store.name,
        createdAt: createdAt.toISOString(),
        note: 'Stok Opname (Pawoon Migrasi)',
        status: 'SUBMITTED',
        items
      });
    }
  }

  const outputFilePath = path.join(__dirname, 'opname_history_localstorage.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(localHistory, null, 2));
  console.log(`\nSUKSES! File JSON berhasil dibuat di: ${outputFilePath}`);
  console.log(`Jumlah record: ${localHistory.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
