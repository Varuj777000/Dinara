import Link from "next/link";
import Form from "next/form";
import { searchParts, getStats, getFeaturedBrands, type SearchMode } from "@/lib/search";
import { PLATFORM_CONTACTS } from "@/lib/contacts";
import { CATEGORIES } from "@/lib/categories";
import { Icon, type IconName } from "@/components/Icon";
import { HeroVisual } from "@/components/HeroVisual";
import { Rotator } from "@/components/Rotator";
import { PartRow } from "@/components/PartRow";
import { ScrollToResults } from "@/components/ScrollToResults";
import { plural } from "@/components/ui";

export const dynamic = "force-dynamic";

const HINTS: Record<SearchMode, string | null> = {
  empty: null,
  exact: null,
  prefix: "Точного совпадения нет. Показаны артикулы, начинающиеся так же.",
  name: "Артикул не найден. Показаны совпадения по наименованию — проверяйте артикул перед заказом.",
  none: null,
};

/** Примеры артикулов, проверенные на реальном прайсе. */
const EXAMPLES = ["GDB2372", "04893700AA", "свеча зажигания"];

/** Оттенок иконки для каждой категории — по порядку в lib/categories.tsx. */
const CATEGORY_HUES = [160, 5, 20, 215, 265, 190, 42, 330];

const STEPS = [
  {
    title: "Введите артикул",
    text: "Например GDB2372 или 04893700AA — мы ищем по паре бренд + номер, а не по названию.",
  },
  {
    title: "Сравните предложения",
    text: "Все магазины, у которых есть эта деталь, — цена и наличие на одном экране.",
  },
  {
    title: "Свяжитесь напрямую",
    text: "Звоните выбранному магазину сами — без посредников, комиссий и потерянного времени.",
  },
];

const SERVICES: { icon: IconName; hue: number; title: string; text: string }[] = [
  {
    icon: "barcode",
    hue: 20,
    title: "Точный поиск по артикулу",
    text: "Одна и та же деталь у разных магазинов называется по-разному — поэтому мы ищем по бренду и номеру, а не по тексту.",
  },
  {
    icon: "compare",
    hue: 215,
    title: "Сравнение цены и наличия",
    text: "Не нужно открывать сайты магазинов по очереди — сразу видно, где дешевле и где есть в наличии.",
  },
  {
    icon: "handshake",
    hue: 160,
    title: "Без скрытых комиссий",
    text: "Площадка не берёт долю с покупки: вы платите магазину напрямую, по его цене.",
  },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [{ mode, items }, stats, featuredBrands] = await Promise.all([
    searchParts(q),
    getStats(),
    getFeaturedBrands(12),
  ]);
  const hint = HINTS[mode];

  const heroStats = [
    { value: stats.products, label: plural(stats.products, ["позиция", "позиции", "позиций"]) },
    { value: stats.offers, label: plural(stats.offers, ["предложение", "предложения", "предложений"]) },
    { value: stats.shops, label: plural(stats.shops, ["магазин", "магазина", "магазинов"]) },
    { value: stats.brands, label: plural(stats.brands, ["бренд", "бренда", "брендов"]) },
  ];

  return (
    <>
      {/* ================= Первый экран ================= */}
      <section className="hero">
        <div className="hero__bg">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
        </div>
        <div className="container hero__grid">
          <div>
            <div className="hero__tag" data-reveal>
              <i>
                <Icon name="check" />
              </i>
              Ищем по бренду и номеру детали
            </div>
            <h1 className="hero__title" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
              Найдите деталь по <span className="hl">артикулу</span>
            </h1>
            <p className="hero__sub" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
              Сравнивайте цены и наличие сразу в нескольких магазинах
              {featuredBrands.length > 0 && (
                <>
                  {" "}
                  — в каталоге <Rotator words={featuredBrands} /> и другие бренды
                </>
              )}
              .
            </p>

            <div className="big-search" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
              <Form action="/" role="search">
                <div className="big-search__field">
                  <Icon name="search" />
                  <input
                    key={q}
                    className="big-search__input"
                    name="q"
                    type="search"
                    defaultValue={q}
                    autoFocus={!q}
                    autoComplete="off"
                    placeholder="Артикул, например GDB2372"
                    aria-label="Артикул детали"
                  />
                  <button className="btn btn--primary" type="submit">
                    Найти <Icon name="arrow" className="icon-arrow" />
                  </button>
                </div>
              </Form>
              <div className="big-search__foot">
                <span>Попробуйте:</span>
                {EXAMPLES.map((ex) => (
                  <Link key={ex} className="try" href={`/?q=${encodeURIComponent(ex)}`}>
                    {ex}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hero__stats" data-reveal style={{ "--d": "320ms" } as React.CSSProperties}>
              {heroStats.map((s, i) => (
                <div key={i}>
                  <b data-count={s.value}>{s.value.toLocaleString("ru-RU")}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ================= Бренды ================= */}
      {featuredBrands.length > 0 && (
        <section className="brands" aria-label="Бренды в каталоге">
          <div className="brands__label">Бренды, которые есть в наличии</div>
          <div className="marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="marquee__track" aria-hidden={copy === 1}>
                {featuredBrands.map((name) => (
                  <Link
                    key={name}
                    className="marquee__item"
                    href={`/?q=${encodeURIComponent(name)}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= Результаты поиска ================= */}
      {q && (
        <section className="results" id="results">
          <ScrollToResults query={q} />
          <div className="container">
            <div className="results__meta">
              <span>
                По запросу <b>«{q}»</b>
              </span>
              {items.length > 0 && (
                <span>
                  Найдено: <b>{items.length}</b>
                </span>
              )}
            </div>

            {hint && (
              <div className="notice notice--warn rise" style={{ marginBottom: 16 }}>
                <Icon name="info" />
                <span>{hint}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="empty rise">
                <span className="empty__ico">
                  <Icon name="search" />
                </span>
                <h3>Ничего не найдено по запросу «{q}»</h3>
                <p>Проверьте артикул: в нём легко перепутать латинскую и русскую букву. Или напишите нам — поможем найти.</p>
                <a className="btn btn--ghost btn--sm" href={PLATFORM_CONTACTS.whatsappHref} style={{ marginTop: 8 }}>
                  <Icon name="chat" /> Спросить в WhatsApp
                </a>
              </div>
            ) : (
              <ul className="parts">
                {items.map((p, i) => (
                  <PartRow key={p.id} part={p} index={i} stockLabel />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ================= Категории ================= */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section__head">
            <div data-reveal>
              <div className="eyebrow">Каталог</div>
              <h2 className="title">Категории</h2>
            </div>
            <p className="lead" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
              Все позиции раздела, которые есть в наличии прямо сейчас. Внутри — фильтр по бренду.
            </p>
          </div>
          <div className="cats">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="cat"
                data-reveal
                style={{ "--h": CATEGORY_HUES[i % CATEGORY_HUES.length], "--d": `${i * 60}ms` } as React.CSSProperties}
              >
                <span className="cat__arrow">
                  <Icon name="arrow" />
                </span>
                <span className="cat__ico">{cat.icon}</span>
                <span>
                  <span className="cat__name">{cat.label}</span>
                  <span className="cat__count" style={{ display: "block" }}>
                    Смотреть в наличии
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="notice" data-reveal style={{ marginTop: 20 }}>
            <Icon name="shield" />
            <span>
              Поиск идёт по артикулу и бренду. Подбора по VIN и марке автомобиля пока нет — он появится только на
              проверенных каталожных данных.
            </span>
          </div>
        </div>
      </section>

      {/* ================= Как это работает ================= */}
      <section className="section" id="how">
        <div className="container">
          <div className="section__head">
            <div data-reveal>
              <div className="eyebrow">Как это работает</div>
              <h2 className="title">Три простых шага</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((step, i) => (
              <div key={step.title} className="step" data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
                <div className="step__num">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Преимущества ================= */}
      <section className="section" id="services">
        <div className="container">
          <div className="section__head">
            <div data-reveal>
              <div className="eyebrow">Почему Dinara</div>
              <h2 className="title">Что вы получаете как покупатель</h2>
            </div>
          </div>
          <div className="features">
            {SERVICES.map((s, i) => (
              <div
                key={s.title}
                className="feature"
                data-reveal
                style={{ "--h": s.hue, "--d": `${i * 100}ms` } as React.CSSProperties}
              >
                <div className="feature__ico">
                  <Icon name={s.icon} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Контакты ================= */}
      <section className="section section--last" id="contact">
        <div className="container">
          <div className="promo" data-reveal="scale">
            <div>
              <div className="eyebrow">Остались вопросы?</div>
              <h2>
                Не нашли деталь? <em>Поможем</em>
              </h2>
              <p>Не уверены в артикуле или нужной позиции нет в поиске — напишите нам, поможем разобраться.</p>
              <div className="promo__city">
                <Icon name="pin" />
                {PLATFORM_CONTACTS.city}
              </div>
            </div>
            <div className="promo__actions">
              <a className="btn btn--primary" href={PLATFORM_CONTACTS.whatsappHref}>
                <Icon name="chat" /> WhatsApp
              </a>
              <a className="btn btn--glass" href={PLATFORM_CONTACTS.telegramHref}>
                <Icon name="send" /> Telegram
              </a>
              <a className="btn btn--glass" href={PLATFORM_CONTACTS.phoneHref}>
                <Icon name="phone" /> {PLATFORM_CONTACTS.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
