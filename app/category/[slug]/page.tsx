import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { searchByCategory, getCategoryBrandFacets } from "@/lib/search";
import { Icon } from "@/components/Icon";
import { PartRow } from "@/components/PartRow";
import { plural } from "@/components/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
/** Тот же порядок оттенков, что и на главной. */
const CATEGORY_HUES = [160, 5, 20, 215, 265, 190, 42, 330];

function pageHref(slug: string, page: number, brand?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (brand) params.set("brand", brand);
  const qs = params.toString();
  return `/category/${slug}${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return { title: category ? category.label : "Категория не найдена" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; brand?: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const { page: pageParam, brand } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ items, total }, brands] = await Promise.all([
    searchByCategory(category.keyword, { page, pageSize: PAGE_SIZE, brand }),
    getCategoryBrandFacets(category.keyword),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hue = CATEGORY_HUES[CATEGORIES.findIndex((c) => c.slug === slug) % CATEGORY_HUES.length];

  return (
    <div className="page">
      <div className="container">
        <Link href="/#categories" className="back">
          <Icon name="arrow-left" /> Все категории
        </Link>

        <header className="page-head rise" style={{ "--h": hue } as React.CSSProperties}>
          <div className="page-head__row">
            <span className="page-head__ico">{category.icon}</span>
            <div>
              <h1>{category.label}</h1>
              <p>
                <b>{total.toLocaleString("ru-RU")}</b> {plural(total, ["позиция", "позиции", "позиций"])} в наличии
                {brand && (
                  <>
                    {" "}
                    — бренд <b>{brand}</b>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        {brands.length > 0 && (
          <nav className="filters rise" style={{ "--d": "80ms" } as React.CSSProperties} aria-label="Фильтр по бренду">
            <Link href={pageHref(slug, 1)} className={`pill${!brand ? " is-active" : ""}`}>
              Все
            </Link>
            {brands.map((b) => (
              <Link
                key={b.name}
                href={pageHref(slug, 1, b.name)}
                className={`pill${brand === b.name ? " is-active" : ""}`}
              >
                {b.name} <small>{b.count}</small>
              </Link>
            ))}
          </nav>
        )}

        <section style={{ marginTop: 18 }}>
          {items.length === 0 ? (
            <div className="empty rise">
              <span className="empty__ico">
                <Icon name="store" />
              </span>
              <h3>
                {brand ? `У бренда «${brand}» здесь ничего нет в наличии` : "В этой категории сейчас ничего нет в наличии"}
              </h3>
              {brand ? (
                <Link href={pageHref(slug, 1)} className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}>
                  Сбросить фильтр
                </Link>
              ) : (
                <p>Остатки в прайсе могли измениться — загляните позже.</p>
              )}
            </div>
          ) : (
            <>
              <ul className="parts">
                {items.map((p, i) => (
                  <PartRow key={p.id} part={p} index={i} />
                ))}
              </ul>

              {totalPages > 1 && (
                <nav className="pager" aria-label="Страницы">
                  <Link
                    href={pageHref(slug, page - 1, brand)}
                    className="round-btn"
                    aria-label="Предыдущая страница"
                    aria-disabled={page <= 1}
                  >
                    <Icon name="arrow-left" />
                  </Link>
                  <span className="pager__info">
                    Страница {page} из {totalPages}
                  </span>
                  <Link
                    href={pageHref(slug, page + 1, brand)}
                    className="round-btn"
                    aria-label="Следующая страница"
                    aria-disabled={page >= totalPages}
                  >
                    <Icon name="arrow" />
                  </Link>
                </nav>
              )}
            </>
          )}
        </section>

        <div className="notice" style={{ marginTop: 24 }}>
          <Icon name="shield" />
          <span>
            Фильтр по бренду только сужает список — он не означает, что деталь подходит к вашему автомобилю. Сверяйте
            артикул со старой деталью или по каталогу производителя.
          </span>
        </div>
      </div>
    </div>
  );
}
