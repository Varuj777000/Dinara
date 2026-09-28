import Link from "next/link";
import type { FoundPart } from "@/lib/search";
import { formatPrice } from "@/lib/normalize";
import { Icon } from "./Icon";
import { hueOf, initialOf, plural } from "./ui";

/** Строка найденной детали — в результатах поиска и в списке категории. */
export function PartRow({ part, index = 0, stockLabel }: { part: FoundPart; index?: number; stockLabel?: boolean }) {
  const style = {
    "--h": hueOf(part.brand),
    "--d": `${Math.min(index * 35, 350)}ms`,
  } as React.CSSProperties;

  return (
    <li className="rise" style={style}>
      <Link href={`/part/${part.id}`} className="part">
        <span className="part__badge" aria-hidden="true">
          {initialOf(part.brand)}
        </span>
        <div className="part__main">
          <div className="part__top">
            <span className="part__article">{part.article}</span>
            <span className="part__brand">{part.brand}</span>
            {part.brandKind === "oem" && <span className="tag tag--oem">оригинал</span>}
            {stockLabel &&
              (part.inStock ? (
                <span className="tag tag--stock">
                  <span className="dot" />в наличии
                </span>
              ) : (
                <span className="tag tag--order">под заказ</span>
              ))}
          </div>
          <p className="part__name">{part.name}</p>
        </div>
        <div className="part__side">
          <div className="part__price">
            <b>{part.minPrice === part.maxPrice ? formatPrice(part.minPrice) : `от ${formatPrice(part.minPrice)}`}</b>
            <small>
              {part.offersCount} {plural(part.offersCount, ["предложение", "предложения", "предложений"])}
            </small>
          </div>
          <span className="part__go" aria-hidden="true">
            <Icon name="arrow" />
          </span>
        </div>
      </Link>
    </li>
  );
}
