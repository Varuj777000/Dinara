import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPart } from "@/lib/search";
import { formatPrice } from "@/lib/normalize";
import { toTelHref } from "@/lib/contacts";
import { Icon } from "@/components/Icon";
import { hueOf, initialOf, plural } from "@/components/ui";

export const dynamic = "force-dynamic";

function freshness(date: Date): string {
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "обновлено только что";
  if (hours < 24) return `обновлено ${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `обновлено ${days} дн назад`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const part = await getPart(Number(id));
  return { title: part ? `${part.articleDisplay} ${part.brand.name}` : "Деталь не найдена" };
}

export default async function PartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const part = await getPart(Number(id));
  if (!part) notFound();

  // Предложения уже отсортированы: сначала в наличии, затем по цене
  const best = part.offers[0];
  const minPrice = part.offers.length ? Math.min(...part.offers.map((o) => o.priceRetail)) : 0;
  const inStockCount = part.offers.filter((o) => o.inStock).length;

  return (
    <div className="page">
      <div className="container">
        <Link href="/" className="back">
          <Icon name="arrow-left" /> К поиску
        </Link>

        <header className="page-head page-head--split rise" style={{ "--h": hueOf(part.brand.name) } as React.CSSProperties}>
          <div>
            <div className="part-head__brand">
              {part.brand.name}
              {part.brand.kind === "oem" && <span className="tag tag--oem">оригинал</span>}
            </div>
            <h1 className="part-head__article">{part.articleDisplay}</h1>
            <p className="part-head__name">{part.name}</p>
          </div>
          {part.offers.length > 0 && (
            <div className="summary">
              <div>
                <b className="is-accent">{formatPrice(minPrice)}</b>
                <span>лучшая цена</span>
              </div>
              <div>
                <b>{part.offers.length}</b>
                <span>{plural(part.offers.length, ["магазин", "магазина", "магазинов"])}</span>
              </div>
              <div>
                <b>{inStockCount}</b>
                <span>в наличии</span>
              </div>
            </div>
          )}
        </header>

        <div className="block-title">
          <h2>Предложения магазинов</h2>
          {part.offers.length > 1 && <span>сначала в наличии и дешевле</span>}
        </div>

        {part.offers.length === 0 ? (
          <div className="empty rise">
            <span className="empty__ico">
              <Icon name="store" />
            </span>
            <h3>Сейчас эту деталь никто не предлагает</h3>
            <p>Загляните позже — магазины регулярно обновляют прайсы.</p>
          </div>
        ) : (
          <ul className="offers">
            {part.offers.map((offer, i) => {
              const isBest = part.offers.length > 1 && offer.id === best?.id;
              return (
                <li
                  key={offer.id}
                  className={`offer rise${isBest ? " is-best" : ""}`}
                  style={{ "--h": hueOf(offer.shop.name), "--d": `${Math.min(i * 50, 300)}ms` } as React.CSSProperties}
                >
                  <span className="offer__ava" aria-hidden="true">
                    {initialOf(offer.shop.name)}
                  </span>
                  <div className="offer__main">
                    <div className="offer__top">
                      <span className="offer__shop">{offer.shop.name}</span>
                      {offer.shop.city && (
                        <span className="offer__city">
                          <Icon name="pin" />
                          {offer.shop.city}
                        </span>
                      )}
                      {isBest && (
                        <span className="tag tag--best">
                          {offer.priceRetail === minPrice ? "дешевле всех" : "лучшее в наличии"}
                        </span>
                      )}
                    </div>
                    <div className="offer__meta">
                      {offer.inStock ? (
                        <span className="tag tag--stock">
                          <span className="dot" />в наличии
                        </span>
                      ) : (
                        <span className="tag tag--order">под заказ</span>
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Icon name="clock" />
                        {freshness(offer.priceUpdatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="offer__side">
                    <span className="offer__price">{formatPrice(offer.priceRetail)}</span>
                    {offer.shop.phone ? (
                      <a className="btn btn--primary btn--sm" href={toTelHref(offer.shop.phone)}>
                        <Icon name="phone" /> Позвонить
                      </a>
                    ) : (
                      <span className="btn btn--muted btn--sm">Телефон уточняется</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="notice notice--warn" style={{ marginTop: 24 }}>
          <Icon name="alert" />
          <span>
            Наличие и цены указаны магазинами и могут измениться. Площадка не проверяет совместимость детали с
            автомобилем — сверяйте артикул со старой деталью или по каталогу производителя перед заказом.
            {part.numericSource && (
              <>
                {" "}
                <b>Внимание:</b> этот артикул пришёл из числовой ячейки прайса, ведущие нули в нём могли быть потеряны.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
