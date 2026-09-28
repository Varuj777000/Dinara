/**
 * Создаёт виртуальные магазины на основе уже импортированного реального прайса.
 *
 * Зачем: с одним магазином нельзя увидеть главный экран продукта — сравнение
 * предложений. Данные берутся из настоящего прайса, но цены и остатки
 * разбрасываются, чтобы витрина вела себя как при нескольких поставщиках.
 *
 * Эти магазины помечены isDemo = true и удаляются одной командой:
 *   npm run demo:shops -- --clear
 */
import { createPrismaClient } from "./prisma-client";

const prisma = createPrismaClient();

/** Детерминированный «шум»: один и тот же товар всегда получает ту же цену. */
function hash(n: number, salt: number): number {
  const x = Math.sin(n * 9301 + salt * 49297) * 43758.5453;
  return x - Math.floor(x);
}

const DEMO = [
  { slug: "demo-avtoliniya", name: "АвтоЛиния", city: "Москва", factor: 1.12, stockRate: 0.55 },
  { slug: "demo-detal-plus", name: "Деталь Плюс", city: "Химки", factor: 0.93, stockRate: 0.35 },
];

async function main() {
  if (process.argv.includes("--clear")) {
    const { count } = await prisma.shop.deleteMany({ where: { isDemo: true } });
    console.log(`Удалено демо-магазинов: ${count}`);
    return;
  }

  const source = await prisma.shop.findFirst({ where: { isDemo: false }, orderBy: { id: "asc" } });
  if (!source) throw new Error("Сначала импортируйте реальный прайс: npm run import");

  const offers = await prisma.offer.findMany({ where: { shopId: source.id } });
  if (!offers.length) throw new Error("У исходного магазина нет предложений");

  console.log(`Источник: ${source.name} (${offers.length} предложений)\n`);

  for (const [i, cfg] of DEMO.entries()) {
    const shop = await prisma.shop.upsert({
      where: { slug: cfg.slug },
      update: { name: cfg.name, city: cfg.city, isDemo: true },
      create: { slug: cfg.slug, name: cfg.name, city: cfg.city, isDemo: true },
    });
    await prisma.offer.deleteMany({ where: { shopId: shop.id } });

    // Каждый магазин держит не весь ассортимент — так выдача выглядит правдоподобно
    const rows = offers
      .filter((o) => hash(o.productId, i + 1) < 0.7)
      .map((o) => {
        const jitter = 0.88 + hash(o.productId, i + 11) * 0.3;
        const inStock = hash(o.productId, i + 21) < cfg.stockRate;
        return {
          shopId: shop.id,
          productId: o.productId,
          priceRetail: Math.max(100, Math.round((o.priceRetail * cfg.factor * jitter) / 100) * 100),
          quantity: inStock ? 1 + Math.floor(hash(o.productId, i + 31) * 8) : 0,
          inStock,
          sourceRows: 1,
        };
      });

    for (let j = 0; j < rows.length; j += 1000) {
      await prisma.offer.createMany({ data: rows.slice(j, j + 1000) });
    }
    console.log(`  ${cfg.name.padEnd(16)} ${rows.length} предложений`);
  }

  console.log("\nГотово. Демо-магазины помечены isDemo и удаляются: npm run demo:shops -- --clear");
}

main()
  .catch((e) => { console.error("ОШИБКА:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
