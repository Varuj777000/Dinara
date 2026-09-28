/**
 * Импорт прайс-листа магазина.
 *
 * Прайс — это ПОЛНЫЙ снимок ассортимента, а не дельта: старые предложения
 * магазина заменяются целиком. Иначе исчезнувшие из прайса позиции вечно
 * висели бы в выдаче как «в наличии».
 *
 *   npm run import -- --file data/tiko.xlsx --shop tiko --name "Тико"
 */
import path from "node:path";
import ExcelJS from "exceljs";
import {
  normalizeArticle, displayArticle, normalizeBrand, prettifyBrand, slugify,
  parsePrice, parseQuantity, looksNumeric, formatPrice,
} from "../lib/normalize";
import { detectRole, isForbiddenColumn, type ColumnRole } from "../lib/columns";
import { BRAND_GROUPS, OEM_HINTS } from "../lib/brand-groups";
import { createPrismaClient } from "./prisma-client";

const prisma = createPrismaClient();

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Ячейка exceljs может быть числом, строкой, rich text, формулой или датой. */
function cellValue(cell: ExcelJS.Cell | undefined): unknown {
  const v = cell?.value;
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if ("richText" in v) return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("");
    if ("text" in v) return (v as { text: string }).text;
    if ("result" in v) return (v as { result: unknown }).result;
    return String(v);
  }
  return v;
}

type RawRow = {
  rowNumber: number;
  article: unknown; brand: unknown; name: unknown;
  quantity: unknown; priceRetail: unknown; priceWholesale: unknown; location: unknown;
};

type Bucket = {
  brandKey: string; brandRaw: string; articleNorm: string; articleDisplay: string;
  names: string[]; quantity: number; prices: number[]; wholesale: number[];
  locations: Set<string>; rows: number; numericSource: boolean;
};

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.brand.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function main() {
  const file = path.resolve(arg("file", "data/tiko.xlsx")!);
  const shopSlug = arg("shop", "tiko")!;
  const shopName = arg("name", "Тико")!;
  const shopCity = arg("city") ?? null;
  const shopPhone = arg("phone") ?? null;

  console.log(`\nФайл:    ${file}`);
  console.log(`Магазин: ${shopName} (${shopSlug})\n`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("В файле нет ни одного листа");

  // --- 1. Находим строку заголовка: шапка не всегда в первой строке ---
  let headerRow = 0;
  let mapping: Partial<Record<ColumnRole, number>> = {};
  const skipped: string[] = [];

  for (let r = 1; r <= Math.min(ws.rowCount, 30); r += 1) {
    const row = ws.getRow(r);
    const candidate: Partial<Record<ColumnRole, number>> = {};
    const localSkipped: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const header = String(cellValue(cell) ?? "").trim();
      if (!header) return;
      if (isForbiddenColumn(header)) { localSkipped.push(header); return; }
      const role = detectRole(header);
      if (role && candidate[role] === undefined) candidate[role] = col;
    });
    const hasPrice = candidate.priceRetail !== undefined || candidate.priceWholesale !== undefined;
    if (candidate.article !== undefined && hasPrice) {
      headerRow = r;
      mapping = candidate;
      skipped.push(...localSkipped);
      break;
    }
  }
  if (!headerRow) throw new Error("Не найдена строка заголовка с колонками «Артикул» и ценой");

  console.log(`Заголовок найден в строке ${headerRow}. Распознанные колонки:`);
  for (const [role, col] of Object.entries(mapping)) {
    const title = String(cellValue(ws.getRow(headerRow).getCell(col as number)) ?? "");
    console.log(`  ${role.padEnd(15)} -> колонка ${col} «${title}»`);
  }
  if (skipped.length) {
    console.log(`\n  Пропущены как конфиденциальные (в базу не попадут): ${[...new Set(skipped)].join(", ")}`);
  }

  // --- 2. Читаем строки ---
  const raw: RawRow[] = [];
  let rowsEmpty = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const get = (role: ColumnRole) =>
      mapping[role] !== undefined ? cellValue(row.getCell(mapping[role]!)) : null;
    const item: RawRow = {
      rowNumber: r,
      article: get("article"), brand: get("brand"), name: get("name"),
      quantity: get("quantity"), priceRetail: get("priceRetail"),
      priceWholesale: get("priceWholesale"), location: get("location"),
    };
    const hasAnything = [item.article, item.brand, item.name, item.priceRetail]
      .some((v) => v !== null && String(v).trim() !== "");
    if (!hasAnything) { rowsEmpty += 1; continue; }
    raw.push(item);
  }
  console.log(`\nСтрок после заголовка: ${ws.rowCount - headerRow} | пустых пропущено: ${rowsEmpty} | к разбору: ${raw.length}`);

  // --- 3. Разбор, карантин, схлопывание дублей ---
  const buckets = new Map<string, Bucket>();
  const quarantine: {
    rowNumber: number; reason: string; rawArticle?: string; rawBrand?: string;
    rawName?: string; rawQty?: string; rawPrice?: string;
  }[] = [];
  const brandVariants = new Map<string, Map<string, number>>();

  for (const row of raw) {
    const asText = (v: unknown) => (v === null || v === undefined ? undefined : String(v).trim() || undefined);
    const quar = (reason: string) => quarantine.push({
      rowNumber: row.rowNumber, reason,
      rawArticle: asText(row.article), rawBrand: asText(row.brand), rawName: asText(row.name),
      rawQty: asText(row.quantity), rawPrice: asText(row.priceRetail),
    });

    const articleNorm = normalizeArticle(row.article);
    if (!articleNorm) { quar("нет артикула"); continue; }

    // Без бренда склеивать нельзя: один и тот же номер бывает у разных производителей
    const brandKey = normalizeBrand(row.brand);
    if (!brandKey) { quar("нет бренда"); continue; }

    const price = parsePrice(row.priceRetail);
    const wholesale = parsePrice(row.priceWholesale);
    if (price === null && wholesale === null) { quar("нет цены"); continue; }

    const brandRaw = String(row.brand).trim();
    if (!brandVariants.has(brandKey)) brandVariants.set(brandKey, new Map());
    const vm = brandVariants.get(brandKey)!;
    vm.set(brandRaw, (vm.get(brandRaw) ?? 0) + 1);

    const key = `${brandKey}|${articleNorm}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        brandKey, brandRaw, articleNorm, articleDisplay: displayArticle(row.article),
        names: [], quantity: 0, prices: [], wholesale: [], locations: new Set(), rows: 0,
        numericSource: looksNumeric(row.article),
      };
      buckets.set(key, b);
    }
    b.rows += 1;
    b.quantity += parseQuantity(row.quantity);
    if (price !== null) b.prices.push(price);
    if (wholesale !== null) b.wholesale.push(wholesale);
    const nm = String(row.name ?? "").trim();
    if (nm) b.names.push(nm);
    const loc = String(row.location ?? "").trim();
    if (loc) b.locations.add(loc);
  }

  console.log(`Сырых позиций: ${buckets.size} | в карантине: ${quarantine.length}`);

  // --- 4. Справочник брендов ---
  const seedAlias = new Map<string, { canonical: string; kind: string }>();
  for (const g of BRAND_GROUPS) {
    for (const a of g.aliases) seedAlias.set(normalizeBrand(a), { canonical: g.canonical, kind: g.kind });
  }
  const oemHints = new Set(OEM_HINTS.map(normalizeBrand));

  const canonicalOf = new Map<string, { name: string; kind: string }>();
  for (const [key, variants] of brandVariants) {
    const seed = seedAlias.get(key);
    if (seed) { canonicalOf.set(key, { name: seed.canonical, kind: seed.kind }); continue; }
    // Каноничное написание: предпочитаем вариант со строчными буквами, иначе самый частый
    const sorted = [...variants.entries()].sort((a, b) => b[1] - a[1]);
    const mixed = sorted.find(([v]) => v !== v.toUpperCase());
    const chosen = prettifyBrand((mixed ?? sorted[0])[0]);
    canonicalOf.set(key, { name: chosen, kind: oemHints.has(key) ? "oem" : "aftermarket" });
  }

  // --- 4б. Пересборка по КАНОНИЧЕСКОМУ бренду ---
  // Сначала группировали по написанию из прайса, но "Land Rover" и "LAND ROVER" —
  // один бренд. Без этого шага два ведра метят в один товар и импорт падает.
  const finalBuckets = new Map<string, Bucket>();
  for (const b of buckets.values()) {
    const canonKey = normalizeBrand(canonicalOf.get(b.brandKey)!.name);
    const key = `${canonKey}|${b.articleNorm}`;
    const target = finalBuckets.get(key);
    if (!target) {
      finalBuckets.set(key, { ...b, brandKey: canonKey, locations: new Set(b.locations) });
      continue;
    }
    target.rows += b.rows;
    target.quantity += b.quantity;
    target.prices.push(...b.prices);
    target.wholesale.push(...b.wholesale);
    target.names.push(...b.names);
    for (const loc of b.locations) target.locations.add(loc);
    target.numericSource = target.numericSource || b.numericSource;
  }

  const merged = [...finalBuckets.values()].filter((b) => b.rows > 1).length;
  const collapsedByBrand = buckets.size - finalBuckets.size;
  console.log(
    `Позиций после схлопывания: ${finalBuckets.size} | из нескольких строк: ${merged}` +
    ` | склеено разными написаниями бренда: ${collapsedByBrand}`
  );

  // --- 5. Запись в базу ---
  const shop = await prisma.shop.upsert({
    where: { slug: shopSlug },
    update: { name: shopName, city: shopCity, phone: shopPhone },
    create: { slug: shopSlug, name: shopName, city: shopCity, phone: shopPhone },
  });

  const run = await prisma.importRun.create({
    data: { shopId: shop.id, fileName: path.basename(file), rowsTotal: raw.length, rowsEmpty },
  });

  const canonNames = new Map<string, { name: string; kind: string }>();
  for (const c of canonicalOf.values()) canonNames.set(normalizeBrand(c.name), c);

  const brandIdByCanon = new Map<string, number>();
  let newBrands = 0;
  for (const [canonKey, c] of canonNames) {
    const existing = await prisma.brandAlias.findUnique({ where: { normalized: canonKey } });
    if (existing) { brandIdByCanon.set(canonKey, existing.brandId); continue; }
    const brand = await prisma.brand.create({
      data: {
        name: c.name,
        kind: c.kind,
        slug: await uniqueSlug(slugify(c.name)),
        aliases: { create: { normalized: canonKey, raw: c.name, source: "seed" } },
      },
    });
    brandIdByCanon.set(canonKey, brand.id);
    newBrands += 1;
  }

  const brandIdByKey = new Map<string, number>();
  for (const [key, c] of canonicalOf) {
    const id = brandIdByCanon.get(normalizeBrand(c.name))!;
    brandIdByKey.set(key, id);
    if (key !== normalizeBrand(c.name)) {
      const variants = brandVariants.get(key)!;
      const rawName = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0];
      await prisma.brandAlias.upsert({
        where: { normalized: key },
        update: {},
        create: { normalized: key, raw: rawName, brandId: id, source: "import" },
      });
    }
  }

  // Полная замена предложений магазина
  await prisma.offer.deleteMany({ where: { shopId: shop.id } });

  let imported = 0;
  const CHUNK = 500;
  const list = [...finalBuckets.values()];
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK);
    await prisma.$transaction(async (tx) => {
      for (const b of chunk) {
        const brandId = brandIdByCanon.get(b.brandKey)!;
        // Самое длинное наименование обычно самое информативное
        const bestName = [...b.names].sort((x, y) => y.length - x.length)[0] ?? b.articleDisplay;
        const product = await tx.product.upsert({
          where: { brandId_articleNorm: { brandId, articleNorm: b.articleNorm } },
          update: { name: bestName, nameLower: bestName.toLowerCase(), numericSource: b.numericSource },
          create: {
            brandId, articleNorm: b.articleNorm, articleDisplay: b.articleDisplay,
            name: bestName, nameLower: bestName.toLowerCase(), numericSource: b.numericSource,
          },
        });
        const retail = b.prices.length ? Math.min(...b.prices) : Math.min(...b.wholesale);
        await tx.offer.create({
          data: {
            shopId: shop.id,
            productId: product.id,
            priceRetail: retail,
            priceWholesale: b.wholesale.length ? Math.min(...b.wholesale) : null,
            quantity: b.quantity,
            inStock: b.quantity > 0,
            locations: b.locations.size ? [...b.locations].join(", ") : null,
            sourceRows: b.rows,
          },
        });
        imported += 1;
      }
    }, { timeout: 120_000 });
    process.stdout.write(`\r  записано ${Math.min(i + CHUNK, list.length)} / ${list.length}`);
  }
  process.stdout.write("\n");

  for (let i = 0; i < quarantine.length; i += CHUNK) {
    await prisma.quarantineRow.createMany({
      data: quarantine.slice(i, i + CHUNK).map((q) => ({ ...q, importRunId: run.id })),
    });
  }

  await prisma.importRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(), status: "done",
      rowsImported: imported, rowsMerged: merged,
      rowsQuarantined: quarantine.length, newBrands,
    },
  });

  // --- 6. Отчёт ---
  const byReason = quarantine.reduce<Record<string, number>>((acc, q) => {
    acc[q.reason] = (acc[q.reason] ?? 0) + 1;
    return acc;
  }, {});
  const numeric = list.filter((b) => b.numericSource).length;
  const prices = list.map((b) => (b.prices.length ? Math.min(...b.prices) : Math.min(...b.wholesale)));
  const line = "=".repeat(58);

  console.log(`\n${line}\nИМПОРТ ЗАВЕРШЁН\n${line}`);
  console.log(`Опубликовано позиций:      ${imported}`);
  console.log(`Схлопнуто дублей:          ${merged}`);
  console.log(`В карантине (не в выдаче): ${quarantine.length}`);
  for (const [reason, n] of Object.entries(byReason)) console.log(`    ${reason.padEnd(24)} ${n}`);
  console.log(`Брендов в справочнике:     ${canonNames.size} (новых: ${newBrands}), написаний в прайсе: ${brandVariants.size}`);
  console.log(`Артикулов из числовых ячеек (риск потери ведущих нулей): ${numeric}`);
  if (prices.length) {
    console.log(`Цены: от ${formatPrice(Math.min(...prices))} до ${formatPrice(Math.max(...prices))}`);
  }
  console.log(`${line}\n`);
}

main()
  .catch((e) => { console.error("\nОШИБКА ИМПОРТА:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
