import { prisma } from "./db";
import { normalizeArticle } from "./normalize";

/**
 * Поиск детали. Порядок жёсткий и намеренный:
 *   1) точное совпадение нормализованного артикула — то, зачем люди приходят;
 *   2) артикул как начало номера — на случай опечатки или сокращения;
 *   3) текст в наименовании — последняя попытка, качество заведомо хуже.
 *
 * Поиска «по совместимости с автомобилем» здесь нет и не будет, пока нет
 * лицензионных данных о фитменте: угадывать, подойдёт ли деталь к машине,
 * недопустимо.
 */

export type SearchMode = "empty" | "exact" | "prefix" | "name" | "none";

export type FoundPart = {
  id: number;
  article: string;
  name: string;
  brand: string;
  brandKind: string;
  offersCount: number;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
};

const PUBLIC_OFFER_FILTER = { shop: { status: "active" } } as const;

const withOffers = {
  brand: true,
  offers: {
    where: PUBLIC_OFFER_FILTER,
    include: { shop: true },
    orderBy: { priceRetail: "asc" },
  },
} as const;

type ProductWithOffers = Awaited<
  ReturnType<typeof prisma.product.findMany<{ include: typeof withOffers }>>
>[number];

function toFound(p: ProductWithOffers): FoundPart {
  const prices = p.offers.map((o) => o.priceRetail);
  return {
    id: p.id,
    article: p.articleDisplay,
    name: p.name,
    brand: p.brand.name,
    brandKind: p.brand.kind,
    offersCount: p.offers.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    inStock: p.offers.some((o) => o.inStock),
  };
}

export async function searchParts(
  query: string
): Promise<{ mode: SearchMode; items: FoundPart[] }> {
  const q = query.trim();
  if (!q) return { mode: "empty", items: [] };

  const hasOffer = { offers: { some: PUBLIC_OFFER_FILTER } };
  const norm = normalizeArticle(q);

  if (norm.length >= 3) {
    const exact = await prisma.product.findMany({
      where: { articleNorm: norm, ...hasOffer },
      include: withOffers,
      take: 50,
    });
    if (exact.length) return { mode: "exact", items: exact.map(toFound) };

    const prefix = await prisma.product.findMany({
      where: { articleNorm: { startsWith: norm }, ...hasOffer },
      include: withOffers,
      take: 50,
      orderBy: { articleNorm: "asc" },
    });
    if (prefix.length) return { mode: "prefix", items: prefix.map(toFound) };
  }

  const byName = await prisma.product.findMany({
    where: { nameLower: { contains: q.toLowerCase() }, ...hasOffer },
    include: withOffers,
    take: 50,
    orderBy: { nameLower: "asc" },
  });
  if (byName.length) return { mode: "name", items: byName.map(toFound) };

  return { mode: "none", items: [] };
}

const IN_STOCK_OFFER_FILTER = { ...PUBLIC_OFFER_FILTER, inStock: true } as const;

/**
 * Товары категории, у которых есть хотя бы одно предложение в наличии.
 * Категорий как отдельной модели в базе нет — это поиск по ключевому слову
 * в наименовании (см. `lib/categories.tsx`), но только среди того, что
 * реально можно купить прямо сейчас.
 */
export async function searchByCategory(
  keyword: string,
  { page = 1, pageSize = 30, brand }: { page?: number; pageSize?: number; brand?: string } = {}
): Promise<{ items: FoundPart[]; total: number }> {
  const where = {
    nameLower: { contains: keyword.toLowerCase() },
    offers: { some: IN_STOCK_OFFER_FILTER },
    ...(brand ? { brand: { name: brand } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        offers: {
          where: IN_STOCK_OFFER_FILTER,
          include: { shop: true },
          orderBy: { priceRetail: "asc" },
        },
      },
      orderBy: { nameLower: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: products.map(toFound), total };
}

/**
 * Бренды, встречающиеся внутри категории (среди товаров в наличии) — чтобы
 * можно было сузить список категории до конкретного бренда/марки. Это
 * обычный фильтр по уже показанному атрибуту, а НЕ подбор по совместимости:
 * мы не утверждаем, что деталь подходит к машине, только группируем по
 * бренду, который и так виден на карточке товара.
 */
export async function getCategoryBrandFacets(
  keyword: string,
  limit = 20
): Promise<{ name: string; count: number }[]> {
  const rows = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
    SELECT b.name as name, COUNT(DISTINCT p.id) as count
    FROM Brand b
    JOIN Product p ON p.brandId = b.id
    JOIN Offer o ON o.productId = p.id
    JOIN Shop s ON s.id = o.shopId
    WHERE p.nameLower LIKE '%' || ${keyword.toLowerCase()} || '%'
      AND o.inStock = 1 AND s.status = 'active'
    GROUP BY b.id
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}

export async function getPart(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      offers: {
        where: PUBLIC_OFFER_FILTER,
        include: { shop: true },
        orderBy: [{ inStock: "desc" }, { priceRetail: "asc" }],
      },
    },
  });
}

export async function getStats() {
  const [products, offers, shops, brands] = await Promise.all([
    prisma.product.count(),
    prisma.offer.count(),
    prisma.shop.count({ where: { status: "active" } }),
    prisma.brand.count(),
  ]);
  return { products, offers, shops, brands };
}

/**
 * Бренды-запчасти (не марки авто), у которых реально есть активные
 * предложения — для витрины доверия на главной. Марки авто (kind: "oem")
 * сюда не попадают, это отдельная витрина «оригинал».
 */
export async function getFeaturedBrands(limit = 10) {
  const rows = await prisma.$queryRaw<{ name: string; offers: bigint }[]>`
    SELECT b.name as name, COUNT(DISTINCT o.id) as offers
    FROM Brand b
    JOIN Product p ON p.brandId = b.id
    JOIN Offer o ON o.productId = p.id
    JOIN Shop s ON s.id = o.shopId
    WHERE b.kind = 'aftermarket' AND s.status = 'active'
    GROUP BY b.id
    ORDER BY offers DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.name);
}
