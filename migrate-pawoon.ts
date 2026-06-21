import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper untuk parsing tanggal format DD-MM-YYYY atau DD-MM-YYYY HH:mm:ss
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = String(dateStr).trim();
  
  // Format DD-MM-YYYY HH:mm:ss
  if (cleanStr.includes(' ')) {
    const [datePart, timePart] = cleanStr.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  
  // Format DD-MM-YYYY
  if (cleanStr.includes('-')) {
    const [day, month, year] = cleanStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Default ke jam 12 siang
  }

  // Fallback jika berupa serial number excel
  const num = Number(cleanStr);
  if (!isNaN(num) && num > 30000) {
    // Excel base date: 30 Dec 1899
    const utcDays = num - 25569;
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
  }

  return new Date(cleanStr);
}

// Map metode pembayaran Pawoon ke DB Enum
function mapPaymentMethod(methodStr: string): 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'CREDIT' | 'SPLIT' {
  if (!methodStr) return 'CASH';
  const clean = methodStr.toLowerCase().trim();
  if (clean.includes('tunai') || clean.includes('cash')) return 'CASH';
  if (clean.includes('qris') || clean.includes('gopay') || clean.includes('ovo') || clean.includes('dana') || clean.includes('shopee') || clean.includes('linkaja')) return 'QRIS';
  if (clean.includes('transfer') || clean.includes('bank')) return 'TRANSFER';
  if (clean.includes('debit')) return 'DEBIT';
  if (clean.includes('kredit') || clean.includes('credit')) return 'CREDIT';
  return 'CASH';
}

async function main() {
  console.log('=== MEMULAI MIGRASI DATA HISTORIS PAWOON (AUTO-CREATE MODE) ===');
  
  // 1. Ambil list store
  const stores = await prisma.store.findMany();
  if (stores.length === 0) {
    console.error('ERROR: Tidak ada store/cabang terdaftar di database.');
    return;
  }
  
  // Ambil store Laila Collection (default)
  let store = stores.find(s => s.name.toLowerCase().includes('laila'));
  if (!store) {
    store = stores[0];
    console.warn(`WARNING: Store "LAILA COLLECTION" tidak ditemukan, menggunakan store default: ${store.name}`);
  } else {
    console.log(`Menggunakan Store: ${store.name} (${store.id})`);
  }

  const baseDir = path.join(__dirname, 'pawoon-files');

  // ========================================================
  // FASE I: SCAN & AUTO-CREATE PRODUK & KATEGORI YANG HILANG
  // ========================================================
  console.log('\n--- FASE 1: MEMINDAI SEMUA FILE UNTUK MENDAFTARKAN PRODUK & KATEGORI ---');
  
  const foundProducts = new Map<string, {
    name: string;
    sku: string;
    categoryName: string;
    costPrice: number;
    sellingPrice: number;
  }>();

  // A. Scan dari file transaksi (Sangat lengkap: Nama, SKU, Kategori, Harga Jual)
  const transactionsDir = path.join(baseDir, 'transactions');
  if (fs.existsSync(transactionsDir)) {
    const files = fs.readdirSync(transactionsDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    for (const file of files) {
      try {
        const filePath = path.join(transactionsDir, file);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let headerIdx = 7;
        for (let r = 0; r < Math.min(rows.length, 15); r++) {
          if (rows[r] && rows[r].includes('ID Struk')) {
            headerIdx = r;
            break;
          }
        }
        const headers = rows[headerIdx];
        if (!headers) continue;

        const skuIdx = headers.indexOf('SKU');
        const productNameIdx = headers.indexOf('Nama Produk');
        const categoryIdx = headers.indexOf('Kategori');
        const priceIdx = headers.indexOf('Harga Produk');

        const dataRows = rows.slice(headerIdx + 1).filter(r => r[productNameIdx]);
        for (const row of dataRows) {
          const name = String(row[productNameIdx] || '').trim();
          const sku = String(row[skuIdx] || '').trim();
          const categoryName = String(row[categoryIdx] || 'Umum').trim();
          const sellingPrice = Number(row[priceIdx] || 0);

          if (!name) continue;
          const key = name.toLowerCase();

          if (!foundProducts.has(key)) {
            foundProducts.set(key, { name, sku, categoryName, costPrice: 0, sellingPrice });
          } else {
            const existing = foundProducts.get(key)!;
            if (sku && !existing.sku) existing.sku = sku;
            if (categoryName && categoryName !== 'Umum' && existing.categoryName === 'Umum') existing.categoryName = categoryName;
            if (sellingPrice > existing.sellingPrice) existing.sellingPrice = sellingPrice;
          }
        }
      } catch (err: any) {
        console.warn(`Gagal men-scan file transaksi ${file}:`, err.message);
      }
    }
  }

  // B. Scan dari file opname (untuk mendapat Harga Modal / Cost Price)
  const opnameDir = path.join(baseDir, 'opname');
  if (fs.existsSync(opnameDir)) {
    const files = fs.readdirSync(opnameDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    for (const file of files) {
      try {
        const filePath = path.join(opnameDir, file);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

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
        const costIdx = headers.indexOf('Harga Per Unit (Sistem)');

        const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);
        for (const row of dataRows) {
          const name = String(row[nameIdx] || '').trim();
          const sku = String(row[skuIdx] || '').trim();
          const costPrice = Number(row[costIdx] || 0);

          if (!name) continue;
          const key = name.toLowerCase();

          if (!foundProducts.has(key)) {
            foundProducts.set(key, { name, sku, categoryName: 'Umum', costPrice, sellingPrice: 0 });
          } else {
            const existing = foundProducts.get(key)!;
            if (sku && !existing.sku) existing.sku = sku;
            if (costPrice > existing.costPrice) existing.costPrice = costPrice;
          }
        }
      } catch (err: any) {
        console.warn(`Gagal men-scan file opname ${file}:`, err.message);
      }
    }
  }

  // C. Scan dari file stok masuk & keluar (tambahan jika ada nama baru)
  const stockMasukDir = path.join(baseDir, 'stock-masuk');
  if (fs.existsSync(stockMasukDir)) {
    const files = fs.readdirSync(stockMasukDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    for (const file of files) {
      try {
        const filePath = path.join(stockMasukDir, file);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let headerIdx = 5;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          if (rows[r] && rows[r].includes('Jumlah') && rows[r].includes('Satuan')) {
            headerIdx = r;
            break;
          }
        }
        const headers = rows[headerIdx];
        if (!headers) continue;
        const nameIdx = headers.indexOf('Nama');

        const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);
        for (const row of dataRows) {
          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;
          const key = name.toLowerCase();
          if (!foundProducts.has(key)) {
            foundProducts.set(key, { name, sku: '', categoryName: 'Umum', costPrice: 0, sellingPrice: 0 });
          }
        }
      } catch (err: any) {}
    }
  }

  const stockKeluarDir = path.join(baseDir, 'stock-keluar');
  if (fs.existsSync(stockKeluarDir)) {
    const files = fs.readdirSync(stockKeluarDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    for (const file of files) {
      try {
        const filePath = path.join(stockKeluarDir, file);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let headerIdx = 5;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          if (rows[r] && rows[r].includes('Jumlah') && rows[r].includes('Satuan')) {
            headerIdx = r;
            break;
          }
        }
        const headers = rows[headerIdx];
        if (!headers) continue;
        const nameIdx = headers.indexOf('Nama');

        const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);
        for (const row of dataRows) {
          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;
          const key = name.toLowerCase();
          if (!foundProducts.has(key)) {
            foundProducts.set(key, { name, sku: '', categoryName: 'Umum', costPrice: 0, sellingPrice: 0 });
          }
        }
      } catch (err: any) {}
    }
  }

  console.log(`Scan selesai. Menemukan total ${foundProducts.size} produk unik dari file Pawoon.`);

  // D. Mulai mendaftarkan Kategori dan Produk ke DB jika belum ada
  console.log('Mulai mensinkronisasikan kategori & produk ke database...');
  
  let categoriesInDb = await prisma.category.findMany({ where: { storeId: store.id } });
  let productsInDb = await prisma.product.findMany({ where: { storeId: store.id, deletedAt: null } });

  let newCategoriesCount = 0;
  let newProductsCount = 0;

  for (const [key, item] of foundProducts.entries()) {
    // 1. Cek / Buat Kategori
    let category = categoriesInDb.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
    if (!category && item.categoryName && item.categoryName !== 'Umum') {
      try {
        category = await prisma.category.create({
          data: {
            storeId: store.id,
            name: item.categoryName,
            isActive: true
          }
        });
        categoriesInDb.push(category);
        newCategoriesCount++;
      } catch (catErr: any) {
        console.error(`Gagal membuat kategori "${item.categoryName}":`, catErr.message);
      }
    }

    // 2. Cek / Buat Produk
    let product = productsInDb.find(p => p.name.toLowerCase() === key || (p.sku && item.sku && p.sku.toLowerCase() === item.sku.toLowerCase()));
    if (!product) {
      try {
        product = await prisma.product.create({
          data: {
            storeId: store.id,
            name: item.name,
            sku: item.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
            categoryId: category ? category.id : null,
            costPrice: item.costPrice || 0,
            sellingPrice: item.sellingPrice || 35000, // default ke 35rb jika tidak terdeteksi
            stock: 0, // di-set 0 dulu, akan kita update di akhir
            minimumStock: 5,
            isActive: true
          }
        });
        productsInDb.push(product);
        newProductsCount++;
      } catch (prodErr: any) {
        console.error(`Gagal membuat produk "${item.name}":`, prodErr.message);
      }
    }
  }

  console.log(`Pendaftaran Kategori & Produk Selesai!`);
  console.log(`-> Kategori baru didaftarkan: ${newCategoriesCount}`);
  console.log(`-> Produk baru didaftarkan: ${newProductsCount}`);

  // Update cache pencarian produk lokal
  const latestProducts = await prisma.product.findMany({
    where: { storeId: store.id, deletedAt: null }
  });

  function findProduct(sku: any, name: string) {
    const skuStr = sku ? String(sku).trim().toLowerCase() : '';
    const nameStr = name ? String(name).trim().toLowerCase() : '';
    
    if (skuStr) {
      const match = latestProducts.find(p => p.sku && p.sku.toLowerCase() === skuStr);
      if (match) return match;
    }
    
    const matchByName = latestProducts.find(p => p.name.toLowerCase() === nameStr);
    if (matchByName) return matchByName;

    const fuzzyMatch = latestProducts.find(p => 
      p.name.toLowerCase().includes(nameStr) || nameStr.includes(p.name.toLowerCase())
    );
    return fuzzyMatch;
  }

  // 3. Ambil atau buat User Kasir default untuk transaksi migrasi
  let cashier = await prisma.user.findFirst({
    where: { storeId: store.id, isStoreAdmin: false, deletedAt: null }
  });
  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        storeId: store.id,
        adminId: store.adminId,
        name: 'Kasir Pawoon Migrasi',
        pin: '9999',
        isActive: true,
        isStoreAdmin: false
      }
    });
    console.log(`Membuat user kasir baru untuk migrasi: ${cashier.name}`);
  }

  // Map untuk menampung pergerakan stok neto agar bisa kita update ke kolom Product.stock di akhir
  const netStockChanges = new Map<string, number>();
  function trackStockChange(productId: string, qty: number, type: 'IN' | 'OUT') {
    const current = netStockChanges.get(productId) || 0;
    if (type === 'IN') {
      netStockChanges.set(productId, current + qty);
    } else {
      netStockChanges.set(productId, current - qty);
    }
  }

  // ==========================================
  // A. PROSES STOK OPNAME
  // ==========================================
  if (fs.existsSync(opnameDir)) {
    const files = fs.readdirSync(opnameDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    console.log(`\n--- FASE 2: MEMPROSES STOK OPNAME (${files.length} file) ---`);
    let opnameCount = 0;
    let opnameItemsCount = 0;

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
      const diffIdx = headers.indexOf('Selisih Jumlah Barang');

      const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);
      
      for (const row of dataRows) {
        const sku = row[skuIdx];
        const name = String(row[nameIdx] || '');
        const systemStock = Number(row[systemStockIdx] || 0);
        const actualStock = Number(row[actualStockIdx] || 0);
        const diff = Number(row[diffIdx] || 0);

        if (diff === 0) continue;

        const product = findProduct(sku, name);
        if (!product) continue;

        const type = diff > 0 ? 'IN' : 'OUT';
        const qty = Math.abs(diff);
        const note = `Stock Opname (Pawoon Migrasi): Fisik=${actualStock}, Sistem=${systemStock} (Selisih=${diff > 0 ? '+' : ''}${diff})`;

        await prisma.stockMovement.create({
          data: {
            storeId: store.id,
            productId: product.id,
            qty,
            type,
            note,
            createdAt
          }
        });
        trackStockChange(product.id, qty, type);
        opnameItemsCount++;
      }
      opnameCount++;
    }
    console.log(`Selesai memproses Stok Opname: ${opnameCount} file, ${opnameItemsCount} log pergerakan stok dicatat.`);
  }

  // ==========================================
  // B. PROSES STOK MASUK
  // ==========================================
  if (fs.existsSync(stockMasukDir)) {
    const files = fs.readdirSync(stockMasukDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    console.log(`\n--- FASE 3: MEMPROSES STOK MASUK (${files.length} file) ---`);
    let count = 0;
    let itemsCount = 0;

    for (const file of files) {
      const filePath = path.join(stockMasukDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const dateRow = rows.find(r => r[0] === 'Tanggal');
      const dateStr = dateRow ? dateRow[1] : '';
      const createdAt = parseDateString(dateStr);

      let headerIdx = 5;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        if (rows[r] && rows[r].includes('Jumlah') && rows[r].includes('Satuan')) {
          headerIdx = r;
          break;
        }
      }

      const headers = rows[headerIdx];
      if (!headers) continue;

      const nameIdx = headers.indexOf('Nama');
      const qtyIdx = headers.indexOf('Jumlah');

      const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);

      for (const row of dataRows) {
        const name = String(row[nameIdx] || '');
        const qty = Math.abs(Number(row[qtyIdx] || 0));

        if (qty === 0) continue;

        const product = findProduct(null, name);
        if (!product) continue;

        await prisma.stockMovement.create({
          data: {
            storeId: store.id,
            productId: product.id,
            qty,
            type: 'IN',
            note: 'Stok Masuk (Pawoon Migrasi)',
            createdAt
          }
        });
        trackStockChange(product.id, qty, 'IN');
        itemsCount++;
      }
      count++;
    }
    console.log(`Selesai memproses Stok Masuk: ${count} file, ${itemsCount} log pergerakan stok dicatat.`);
  }

  // ==========================================
  // C. PROSES STOK KELUAR
  // ==========================================
  if (fs.existsSync(stockKeluarDir)) {
    const files = fs.readdirSync(stockKeluarDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    console.log(`\n--- FASE 4: MEMPROSES STOK KELUAR (${files.length} file) ---`);
    let count = 0;
    let itemsCount = 0;

    for (const file of files) {
      const filePath = path.join(stockKeluarDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const dateRow = rows.find(r => r[0] === 'Tanggal');
      const dateStr = dateRow ? dateRow[1] : '';
      const createdAt = parseDateString(dateStr);

      let headerIdx = 5;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        if (rows[r] && rows[r].includes('Jumlah') && rows[r].includes('Satuan')) {
          headerIdx = r;
          break;
        }
      }

      const headers = rows[headerIdx];
      if (!headers) continue;

      const nameIdx = headers.indexOf('Nama');
      const qtyIdx = headers.indexOf('Jumlah');

      const dataRows = rows.slice(headerIdx + 1).filter(r => r[nameIdx]);

      for (const row of dataRows) {
        const name = String(row[nameIdx] || '');
        const qty = Math.abs(Number(row[qtyIdx] || 0));

        if (qty === 0) continue;

        const product = findProduct(null, name);
        if (!product) continue;

        await prisma.stockMovement.create({
          data: {
            storeId: store.id,
            productId: product.id,
            qty,
            type: 'OUT',
            note: 'Stok Keluar (Pawoon Migrasi)',
            createdAt
          }
        });
        trackStockChange(product.id, qty, 'OUT');
        itemsCount++;
      }
      count++;
    }
    console.log(`Selesai memproses Stok Keluar: ${count} file, ${itemsCount} log pergerakan stok dicatat.`);
  }

  // ==========================================
  // D. PROSES TRANSAKSI PENJUALAN
  // ==========================================
  if (fs.existsSync(transactionsDir)) {
    const files = fs.readdirSync(transactionsDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
    console.log(`\n--- FASE 5: MEMPROSES TRANSAKSI PENJUALAN (${files.length} file) ---`);
    let totalTransactionsImported = 0;
    let totalTransactionItemsImported = 0;

    for (const file of files) {
      console.log(`Membaca file transaksi: ${file}...`);
      const filePath = path.join(transactionsDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      let headerIdx = 7;
      for (let r = 0; r < Math.min(rows.length, 15); r++) {
        if (rows[r] && rows[r].includes('ID Struk') && rows[r].includes('Tanggal & Waktu')) {
          headerIdx = r;
          break;
        }
      }

      const headers = rows[headerIdx];
      if (!headers) continue;

      const dateIdx = headers.indexOf('Tanggal & Waktu');
      const invoiceIdx = headers.indexOf('ID Struk');
      const paymentStatusIdx = headers.indexOf('Status Pembayaran');
      const skuIdx = headers.indexOf('SKU');
      const productNameIdx = headers.indexOf('Nama Produk');
      const qtyIdx = headers.indexOf('Jumlah Produk');
      const priceIdx = headers.indexOf('Harga Produk');
      const discountIdx = headers.indexOf('Diskon Produk');
      const subtotalIdx = headers.indexOf('Subtotal');
      const totalDiscountIdx = headers.indexOf('Diskon Transaksi');
      const totalIdx = headers.indexOf('Total');
      const paymentMethodIdx = headers.indexOf('Metode Pembayaran');
      const paidAmountIdx = headers.indexOf('Pembayaran');

      const dataRows = rows.slice(headerIdx + 1).filter(r => r[invoiceIdx]);

      const invoiceGroups = new Map<string, any[]>();
      for (const row of dataRows) {
        const invNo = String(row[invoiceIdx]).trim();
        if (!invoiceGroups.has(invNo)) {
          invoiceGroups.set(invNo, []);
        }
        invoiceGroups.get(invNo)!.push(row);
      }

      console.log(`Mengelompokkan ${invoiceGroups.size} transaksi unik dari file.`);

      for (const [invoiceNumber, itemRows] of invoiceGroups.entries()) {
        const existingTx = await prisma.transaction.findFirst({
          where: { storeId: store.id, invoiceNumber }
        });
        if (existingTx) continue;

        const firstRow = itemRows[0];
        const dateStr = String(firstRow[dateIdx]);
        const createdAt = parseDateString(dateStr);
        const rawStatus = String(firstRow[paymentStatusIdx] || '').toLowerCase();
        
        let status: 'PAID' | 'CANCELLED' | 'PENDING' | 'REFUNDED' = 'PAID';
        if (rawStatus.includes('batal') || rawStatus.includes('cancel') || rawStatus.includes('void')) {
          status = 'CANCELLED';
        }

        const rawMethod = String(firstRow[paymentMethodIdx] || '');
        const paymentMethod = mapPaymentMethod(rawMethod);

        const subtotalTx = Number(firstRow[subtotalIdx] || 0);
        const transactionDiscount = Number(firstRow[totalDiscountIdx] || 0);
        const totalTx = Number(firstRow[totalIdx] || 0);
        const paidAmount = Number(firstRow[paidAmountIdx] || totalTx);
        const changeAmount = Math.max(0, paidAmount - totalTx);

        const itemsToCreate: {
          productId: string;
          quantity: number;
          originalPrice: number;
          masterDiscount: number;
          cashierDiscount: number;
          finalPrice: number;
          subtotal: number;
        }[] = [];
        let totalDiscountProducts = 0;

        for (const row of itemRows) {
          const sku = row[skuIdx];
          const name = String(row[productNameIdx] || '');
          const qty = Number(row[qtyIdx] || 0);
          const price = Number(row[priceIdx] || 0);
          const disc = Math.abs(Number(row[discountIdx] || 0));
          
          if (qty <= 0) continue;

          const product = findProduct(sku, name);
          if (!product) continue;

          const itemSubtotal = (price * qty) - disc;
          totalDiscountProducts += disc;

          itemsToCreate.push({
            productId: product.id,
            quantity: qty,
            originalPrice: price,
            masterDiscount: disc,
            cashierDiscount: 0,
            finalPrice: price - (disc / qty),
            subtotal: itemSubtotal
          });

          // Transaksi sukses memotong stok
          if (status === 'PAID') {
            trackStockChange(product.id, qty, 'OUT');
          }
        }

        if (itemsToCreate.length === 0) continue;

        const finalSubtotal = itemsToCreate.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
        const finalDiscount = totalDiscountProducts + transactionDiscount;
        const finalTotal = Math.max(0, finalSubtotal - finalDiscount);

        await prisma.transaction.create({
          data: {
            invoiceNumber,
            subtotal: finalSubtotal,
            totalDiscount: finalDiscount,
            total: finalTotal,
            paidAmount: paidAmount,
            changeAmount: changeAmount,
            paymentMethod,
            status,
            storeId: store.id,
            cashierId: cashier.id,
            orderType: 'TAKEAWAY',
            createdAt,
            updatedAt: createdAt,
            items: {
              create: itemsToCreate
            }
          }
        });

        totalTransactionsImported++;
        totalTransactionItemsImported += itemsToCreate.length;
      }
    }
    console.log(`Selesai memproses Transaksi: ${totalTransactionsImported} transaksi berhasil di-import, ${totalTransactionItemsImported} item penjualan dimasukkan.`);
  }

  // ========================================================
  // FASE VI: UPDATE STOK AKHIR DI KATALOG PRODUK
  // ========================================================
  console.log('\n--- FASE 6: MENGHITUNG & MENG-UPDATE STOK AKHIR PRODUK DI KATALOG ---');
  let updatedProductsCount = 0;
  for (const [productId, change] of netStockChanges.entries()) {
    try {
      // Kita set stok produk di tabel Product sama dengan akumulasi pergerakan historisnya (bisa kita batasi minimal 0 agar tidak minus)
      const finalStock = Math.max(0, change);
      await prisma.product.update({
        where: { id: productId },
        data: { stock: finalStock }
      });
      updatedProductsCount++;
    } catch (err: any) {
      console.error(`Gagal mengupdate stok akhir untuk produk ID ${productId}:`, err.message);
    }
  }
  console.log(`Berhasil meng-update stok akhir untuk ${updatedProductsCount} produk di database.`);

  console.log('\n=== PROSES MIGRASI DATA LENGKAP & SINKRONISASI SELESAI ===');
}

main()
  .catch((e) => {
    console.error('ERROR terjadi selama migrasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
